'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Delivery, DeliveryFormInput, DeliveryStatus } from '@/types/hospital/supply-order-type'

// 납품 확인서 단건 조회
export async function getDeliveryById(
  hosId: string,
  deliveryId: string,
): Promise<Delivery | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', deliveryId)
    .eq('hos_id', hosId)
    .single()

  if (error) return null
  return data as Delivery
}

// 주문에 연결된 납품 목록
export async function getDeliveriesByOrder(
  hosId: string,
  orderId: string,
): Promise<Delivery[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('hos_id', hosId)
    .eq('order_id', orderId)
    .order('delivery_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Delivery[]
}

// 납품 확인서 생성 (주문에 연결)
export async function createDelivery(
  hosId: string,
  vendorId: string,
  orderId: string,
  input: DeliveryFormInput,
): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      hos_id: hosId,
      vendor_id: vendorId,
      order_id: orderId,
      delivery_date: input.delivery_date,
      vendor_deliverer: input.vendor_deliverer.trim() || null,
      memo: input.memo.trim() || null,
      status: 'pending',
      source_type: 'manual',
      received_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? '납품 확인서 생성 실패')
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  return data.id
}

// 납품 확인서 삭제 (pending/reviewing만 허용)
export async function deleteDelivery(hosId: string, deliveryId: string): Promise<void> {
  const supabase = await createClient()

  // inventory_logs 삭제 (confirmed됐다가 되돌린 경우 대비)
  await supabase
    .from('inventory_logs')
    .delete()
    .eq('hos_id', hosId)
    .eq('reference_type', 'delivery')
    .eq('reference_id', deliveryId)

  // delivery_items 삭제
  await supabase.from('delivery_items').delete().eq('delivery_id', deliveryId)

  // delivery 삭제 및 order_id 반환
  const { data, error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', deliveryId)
    .eq('hos_id', hosId)
    .select('order_id')
    .single()

  if (error) throw new Error(error.message)

  // 연결된 order 상태를 confirmed로 되돌리기
  if (data?.order_id) {
    await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', data.order_id)
      .eq('hos_id', hosId)
  }

  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

// 주문에 연결된 모든 납품 확인서 삭제 (주문 삭제/되돌리기용 내부 헬퍼)
async function deleteDeliveriesByOrder(hosId: string, orderId: string): Promise<void> {
  const supabase = await createClient()

  const { data: deliveries } = await supabase
    .from('deliveries')
    .select('id')
    .eq('hos_id', hosId)
    .eq('order_id', orderId)

  if (!deliveries?.length) return

  const deliveryIds = deliveries.map((d) => d.id)

  await supabase
    .from('inventory_logs')
    .delete()
    .eq('hos_id', hosId)
    .eq('reference_type', 'delivery')
    .in('reference_id', deliveryIds)

  await supabase.from('delivery_items').delete().in('delivery_id', deliveryIds)

  await supabase.from('deliveries').delete().in('id', deliveryIds).eq('hos_id', hosId)
}

export { deleteDeliveriesByOrder }

// 납품 상태 변경
export async function updateDeliveryStatus(
  hosId: string,
  deliveryId: string,
  status: DeliveryStatus,
): Promise<void> {
  const supabase = await createClient()
  const updateData: Record<string, unknown> = { status }

  if (status === 'confirmed' || status === 'partial') {
    const { data: { user } } = await supabase.auth.getUser()
    updateData.confirmed_by = user?.id ?? null
    updateData.confirmed_at = new Date().toISOString()

    // delivery_items → inventory_logs IN 기록
    const { data: items } = await supabase
      .from('delivery_items')
      .select('id, item_master_id, item_product_id, base_quantity, quantity_received, unit, item_master(base_unit)')
      .eq('delivery_id', deliveryId)
      .not('item_master_id', 'is', null)

    if (items && items.length > 0) {
      const logs = items
        .filter((item: any) => (item.base_quantity ?? item.quantity_received) > 0)
        .map((item: any) => ({
          hos_id: hosId,
          item_master_id: item.item_master_id,
          item_product_id: item.item_product_id ?? null,
          transaction_type: 'IN',
          quantity: item.base_quantity ?? item.quantity_received,
          base_unit: (item.item_master as any)?.base_unit ?? item.unit,
          reference_type: 'delivery',
          reference_id: deliveryId,
          created_by: user?.id ?? null,
        }))

      if (logs.length > 0) {
        await supabase.from('inventory_logs').insert(logs)
      }
    }
  }

  // confirmed → reviewing 되돌리기 시 inventory_logs 취소
  if (status === 'reviewing') {
    await supabase
      .from('inventory_logs')
      .delete()
      .eq('hos_id', hosId)
      .eq('reference_type', 'delivery')
      .eq('reference_id', deliveryId)
      .eq('transaction_type', 'IN')
  }

  // delivery 상태 업데이트
  const { data: updatedDelivery, error } = await supabase
    .from('deliveries')
    .update(updateData)
    .eq('id', deliveryId)
    .eq('hos_id', hosId)
    .select('order_id')
    .single()

  if (error) throw new Error(error.message)

  // 연결된 order 상태 동기화
  const orderId = updatedDelivery?.order_id
  if (orderId) {
    let orderStatus: string | null = null
    if (status === 'confirmed') orderStatus = 'delivered'
    else if (status === 'partial') orderStatus = 'partial'
    else if (status === 'reviewing') orderStatus = 'delivering'  // 되돌리기

    if (orderStatus) {
      await supabase
        .from('orders')
        .update({ status: orderStatus })
        .eq('id', orderId)
        .eq('hos_id', hosId)
    }
  }

  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

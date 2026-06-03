'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Order, OrderFormInput, OrderStatus, OrderItemStatus } from '@/types/hospital/supply-order-type'
import { deleteDeliveriesByOrder } from './delivery-actions'

// 주문 단건 조회
export async function getOrderById(hosId: string, orderId: string): Promise<Order | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, vendor:vendors(id, name, categories, contacts, representative_phone), order_items(*, item_master(id, generic_name, category, base_unit))')
    .eq('hos_id', hosId)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as Order
}

// 업체별 주문 목록
export async function getOrdersByVendor(hosId: string, vendorId: string): Promise<Order[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, vendor:vendors(id, name, categories), order_items(*, item_master(id, generic_name, category, base_unit))')
    .eq('hos_id', hosId)
    .eq('vendor_id', vendorId)
    .order('order_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Order[]
}

// 업체별 주문 요약 (사이드바 뱃지용 — 진행중/입고대기 카운트)
export async function getVendorOrderSummary(
  hosId: string,
  vendorId: string,
): Promise<{ active: number; pending_delivery: number }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('hos_id', hosId)
    .eq('vendor_id', vendorId)
    .in('status', ['draft', 'ordered', 'confirmed', 'delivering'])

  if (error) return { active: 0, pending_delivery: 0 }

  const rows = data ?? []
  const active = rows.filter((r) => ['draft', 'ordered', 'confirmed'].includes(r.status)).length
  const pending_delivery = rows.filter((r) => r.status === 'delivering').length
  return { active, pending_delivery }
}

// 주문서 생성
export async function createOrder(
  hosId: string,
  vendorId: string,
  input: OrderFormInput,
): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      hos_id: hosId,
      vendor_id: vendorId,
      order_date: input.order_date,
      vendor_contact: input.vendor_contact.trim() || null,
      memo: input.memo.trim() || null,
      status: 'draft',
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (orderError || !order) throw new Error(orderError?.message ?? '주문서 생성 실패')

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('order_items').insert(
      input.items.map((item) => ({
        order_id: order.id,
        item_master_id: item.item_master_id,
        quantity: item.quantity,
        unit: item.unit,
        units_per_order_unit: item.units_per_order_unit,
        unit_price: item.unit_price ? Number(item.unit_price) : null,
        memo: item.memo.trim() || null,
      })),
    )
    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  return order.id
}

// 동일 날짜·업체 draft 주문서 조회
export async function findDraftOrderByVendorDate(
  hosId: string,
  vendorId: string,
  orderDate: string,
): Promise<{ id: string; item_count: number } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_items(id)')
    .eq('hos_id', hosId)
    .eq('vendor_id', vendorId)
    .eq('order_date', orderDate)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return { id: data.id, item_count: (data.order_items as any[]).length }
}

// 기존 주문서에 품목 추가
export async function appendOrderItems(
  hosId: string,
  orderId: string,
  items: OrderFormInput['items'],
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('order_items').insert(
    items.map((item) => ({
      order_id: orderId,
      item_master_id: item.item_master_id,
      quantity: item.quantity,
      unit: item.unit,
      units_per_order_unit: item.units_per_order_unit,
      unit_price: item.unit_price ? Number(item.unit_price) : null,
      memo: item.memo.trim() || null,
    })),
  )
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

// 주문 품목 상태 변경
export async function updateOrderItemStatus(
  hosId: string,
  itemId: string,
  status: OrderItemStatus,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('order_items')
    .update({ item_status: status })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

// 주문 품목 메모 수정
export async function updateOrderItemMemo(
  hosId: string,
  itemId: string,
  memo: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('order_items')
    .update({ memo: memo.trim() || null })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

// 주문서 수정 (헤더 + 품목 전체 교체)
export async function updateOrder(
  hosId: string,
  orderId: string,
  input: OrderFormInput,
): Promise<void> {
  const supabase = await createClient()

  const { error: headerError } = await supabase
    .from('orders')
    .update({
      order_date: input.order_date,
      vendor_contact: input.vendor_contact.trim() || null,
      memo: input.memo.trim() || null,
    })
    .eq('id', orderId)
    .eq('hos_id', hosId)

  if (headerError) throw new Error(headerError.message)

  // 기존 품목 전체 삭제 후 재삽입
  const { error: deleteError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  if (deleteError) throw new Error(deleteError.message)

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('order_items').insert(
      input.items.map((item) => ({
        order_id: orderId,
        item_master_id: item.item_master_id,
        quantity: item.quantity,
        unit: item.unit,
        units_per_order_unit: item.units_per_order_unit,
        unit_price: item.unit_price ? Number(item.unit_price) : null,
        memo: item.memo.trim() || null,
      })),
    )
    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

// 주문 상태 변경
export async function updateOrderStatus(
  hosId: string,
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  // confirmed로 되돌리기 = 배송 전 단계 → 연결된 deliveries 모두 삭제
  if (status === 'confirmed') {
    await deleteDeliveriesByOrder(hosId, orderId)
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

// 기간별 주문 목록 (주문내역 탭)
export async function getOrdersByDateRange(
  hosId: string,
  startDate: string,
  endDate: string,
): Promise<Order[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, vendor:vendors(id, name), order_items(id)')
    .eq('hos_id', hosId)
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .order('order_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Order[]
}

// 주문서 삭제 (draft 상태만)
export async function deleteOrder(hosId: string, orderId: string): Promise<void> {
  // 연결된 deliveries(및 delivery_items, inventory_logs) 먼저 삭제
  await deleteDeliveriesByOrder(hosId, orderId)

  const supabase = await createClient()

  // order_items 삭제
  await supabase.from('order_items').delete().eq('order_id', orderId)

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

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
  }

  const { error } = await supabase
    .from('deliveries')
    .update(updateData)
    .eq('id', deliveryId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

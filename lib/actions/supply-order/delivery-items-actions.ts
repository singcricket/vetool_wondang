'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DeliveryItem, DeliveryItemFormInput } from '@/types/hospital/supply-order-type'

export type LastDeliveryItem = {
  item_master_id: string
  item_product_id: string | null
  quantity_received: number
  unit: string
  unit_price: number | null
  units_per_package: number
}

export async function getLastDeliveryItemsByMaster(
  hosId: string,
  vendorId: string,
  masterIds: string[],
): Promise<LastDeliveryItem[]> {
  if (masterIds.length === 0) return []
  const supabase = await createClient()

  // 해당 업체의 confirmed 납품 목록 — 날짜 내림차순
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select('id')
    .eq('hos_id', hosId)
    .eq('vendor_id', vendorId)
    .eq('status', 'confirmed')
    .order('delivery_date', { ascending: false })

  if (!deliveries || deliveries.length === 0) return []

  const deliveryIds = deliveries.map((d) => d.id)

  const { data: items, error } = await supabase
    .from('delivery_items')
    .select('item_master_id, item_product_id, quantity_received, unit, unit_price, units_per_package, delivery_id')
    .in('delivery_id', deliveryIds)
    .in('item_master_id', masterIds)

  if (error) throw new Error(error.message)

  // deliveryIds 순서(최신순)로 정렬 후 품목별 첫 번째(최신) 납품 추출
  const orderMap = new Map(deliveryIds.map((id, i) => [id, i]))
  const sorted = (items ?? []).slice().sort(
    (a, b) => (orderMap.get(a.delivery_id) ?? 999) - (orderMap.get(b.delivery_id) ?? 999),
  )

  const seen = new Set<string>()
  const result: LastDeliveryItem[] = []
  for (const row of sorted) {
    if (!row.item_master_id || seen.has(row.item_master_id)) continue
    seen.add(row.item_master_id)
    result.push({
      item_master_id: row.item_master_id,
      item_product_id: row.item_product_id,
      quantity_received: row.quantity_received,
      unit: row.unit,
      unit_price: row.unit_price,
      units_per_package: row.units_per_package,
    })
  }
  return result
}

export async function getDeliveryItems(
  hosId: string,
  deliveryId: string,
): Promise<DeliveryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('delivery_items')
    .select(`
      *,
      item_master (id, generic_name, category, base_unit),
      item_products (id, brand_name, manufacturer)
    `)
    .eq('delivery_id', deliveryId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    ...row,
    item_master: row.item_master ?? null,
    item_product: row.item_products ?? null,
  })) as DeliveryItem[]
}

export async function createDeliveryItem(
  hosId: string,
  deliveryId: string,
  input: DeliveryItemFormInput,
): Promise<string> {
  const supabase = await createClient()

  // 제품명을 raw_name으로 사용 (수동 입력 = 이미 매핑된 상태)
  let rawName = '(직접입력)'
  if (input.item_product_id) {
    const { data: product } = await supabase
      .from('item_products')
      .select('brand_name')
      .eq('id', input.item_product_id)
      .single()
    if (product) rawName = product.brand_name
  } else if (input.item_master_id) {
    const { data: master } = await supabase
      .from('item_master')
      .select('generic_name')
      .eq('id', input.item_master_id)
      .single()
    if (master) rawName = master.generic_name
  }

  const { data, error } = await supabase
    .from('delivery_items')
    .insert({
      delivery_id: deliveryId,
      raw_name: rawName,
      item_master_id: input.item_master_id || null,
      item_product_id: input.item_product_id || null,
      quantity_received: input.quantity_received,
      unit: input.unit,
      units_per_package: input.units_per_package,
      unit_price: input.unit_price ? Number(input.unit_price) : null,
      expiry_date: input.expiry_date || null,
      lot_number: input.lot_number.trim() || null,
      memo: input.memo.trim() || null,
      mapping_status: input.item_master_id ? 'mapped' : 'pending',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? '납품 품목 생성 실패')
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
  return data.id
}

export async function updateDeliveryItem(
  hosId: string,
  itemId: string,
  input: DeliveryItemFormInput,
): Promise<void> {
  const supabase = await createClient()

  let rawName = '(직접입력)'
  if (input.item_master_id) {
    const { data: master } = await supabase
      .from('item_master')
      .select('generic_name')
      .eq('id', input.item_master_id)
      .single()
    if (master) rawName = master.generic_name
  }

  const { error } = await supabase
    .from('delivery_items')
    .update({
      raw_name: rawName,
      item_master_id: input.item_master_id || null,
      item_product_id: input.item_product_id || null,
      quantity_received: input.quantity_received,
      unit: input.unit,
      units_per_package: input.units_per_package,
      unit_price: input.unit_price ? Number(input.unit_price) : null,
      expiry_date: input.expiry_date || null,
      lot_number: input.lot_number.trim() || null,
      memo: input.memo.trim() || null,
      mapping_status: input.item_master_id ? 'mapped' : 'pending',
    })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

export async function deleteDeliveryItem(
  hosId: string,
  itemId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('delivery_items')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}

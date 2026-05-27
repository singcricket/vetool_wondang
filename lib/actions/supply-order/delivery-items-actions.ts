'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DeliveryItem, DeliveryItemFormInput } from '@/types/hospital/supply-order-type'

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

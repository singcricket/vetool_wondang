'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  matchItemsWithAI,
  extractFromInvoicePhoto,
  parseDeliveryExcel,
} from './delivery-upload-actions'
import type {
  ExtractedDeliveryItem,
  ItemProduct,
  ReviewInventoryItem,
} from '@/types/hospital/supply-order-type'

export { extractFromInvoicePhoto, parseDeliveryExcel }

export async function matchItemsForInventory(
  items: ExtractedDeliveryItem[],
  itemProducts: ItemProduct[],
  vendorId?: string,
): Promise<ReviewInventoryItem[]> {
  const reviewItems = await matchItemsWithAI(items, itemProducts, vendorId)

  return reviewItems.map((item) => {
    const product = itemProducts.find((p) => p.id === item.matched_product_id)
    return {
      ...item,
      item_master_id: product?.item_master_id ?? null,
      decision: (item.matched_product_id ? 'confirm' : 'new_product') as ReviewInventoryItem['decision'],
    }
  })
}

type SaveRow = {
  productId: string | null
  productIsNew: boolean
  newBrandName: string
  newSpec: string
  newManufacturer: string
  masterId: string | null
  masterIsNew: boolean
  newMasterName: string
  newMasterBaseUnit: string
  pendingMasterId: string
  quantity: number
  unit: string
  unitPrice: string
  expiryDate: string
  lotNumber: string
}

export async function saveInventoryUploadItems(
  hosId: string,
  rows: SaveRow[],
  vendorId?: string,
): Promise<{ saved: number; skipped: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let saved = 0
  let skipped = 0

  const logInserts: {
    hos_id: string
    item_master_id: string
    item_product_id: string | null
    transaction_type: 'IN'
    quantity: number
    base_unit: string
    expiry_date: string | null
    lot_number: string | null
    unit_price: number | null
    vendor_id: string | null
    reference_type: string
    created_by: string | null
  }[] = []

  for (const row of rows) {
    let productId = row.productId
    let masterId = row.masterId

    // 신규 제품 생성
    if (row.productIsNew || !productId) {
      const { data: newProduct, error } = await supabase
        .from('item_products')
        .insert({
          hos_id: hosId,
          brand_name: row.newBrandName.trim() || '(이름 없음)',
          manufacturer: row.newManufacturer.trim() || null,
          specification: row.newSpec.trim() || null,
          package_type: '낱개',
          units_per_package: 1,
          is_active: true,
          item_master_id: null,
          vendor_ids: vendorId ? [vendorId] : [],
          category: [],
          tag: [],
        })
        .select('id')
        .single()
      if (error || !newProduct) { skipped++; continue }
      productId = newProduct.id
    }

    // 신규 품목 마스터 생성
    if (row.masterIsNew && row.newMasterName.trim()) {
      const { data: newMaster, error } = await supabase
        .from('item_master')
        .insert({
          hos_id: hosId,
          generic_name: row.newMasterName.trim(),
          base_unit: row.newMasterBaseUnit.trim() || row.unit || '개',
          category: [],
          loc: [],
          is_active: true,
        })
        .select('id')
        .single()
      if (error || !newMaster) { skipped++; continue }
      masterId = newMaster.id

      // 제품에 마스터 연결
      await supabase
        .from('item_products')
        .update({ item_master_id: masterId })
        .eq('id', productId!)
        .eq('hos_id', hosId)
    }

    // 기존 마스터 연결
    if (!masterId && row.pendingMasterId) {
      masterId = row.pendingMasterId
      await supabase
        .from('item_products')
        .update({ item_master_id: masterId })
        .eq('id', productId!)
        .eq('hos_id', hosId)
    }

    if (!masterId) { skipped++; continue }

    logInserts.push({
      hos_id: hosId,
      item_master_id: masterId,
      item_product_id: productId,
      transaction_type: 'IN',
      quantity: Math.abs(row.quantity),
      base_unit: row.unit || '개',
      expiry_date: row.expiryDate || null,
      lot_number: row.lotNumber.trim() || null,
      unit_price: row.unitPrice ? Number(row.unitPrice) : null,
      vendor_id: vendorId ?? null,
      reference_type: 'invoice_upload',
      created_by: user?.id ?? null,
    })
    saved++
  }

  if (logInserts.length > 0) {
    const { error } = await supabase.from('inventory_logs').insert(logInserts)
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)

  return { saved, skipped }
}

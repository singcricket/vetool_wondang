'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InventoryItem } from '@/types/hospital/supply-order-type'

export type InventoryBatch = {
  item_product_id: string | null  // null = 제품 미지정 입고분
  brand_name: string
  specification: string | null
  manufacturer: string | null
  current_stock: number
  last_in_date: string | null
}

const NULL_BATCH_KEY = '__unspecified__'

export type UsageLogEntry = {
  id: string
  quantity: number
  base_unit: string
  memo: string | null
  created_at: string
}

export type InLogEntry = {
  id: string
  quantity: number
  base_unit: string
  memo: string | null
  expiry_date: string | null
  created_at: string
}

export type ProductDetailLog = {
  item_product_id: string | null  // null = 제품 미지정
  brand_name: string
  specification: string | null
  manufacturer: string | null
  total_in: number
  in_logs: InLogEntry[]
  out_logs: UsageLogEntry[]
  current_stock: number
}

const NULL_DETAIL_KEY = '__unspecified__'

export async function getInventoryStatus(hosId: string): Promise<InventoryItem[]> {
  const supabase = await createClient()

  const [
    { data: masters, error: masterError },
    { data: inventory, error: invError },
    { data: expiryRows },
  ] = await Promise.all([
    supabase
      .from('item_master')
      .select('id, generic_name, category, loc, base_unit, default_vendor, alert_min_stock, reorder_qty, is_active')
      .eq('hos_id', hosId)
      .eq('is_active', true)
      .order('generic_name'),
    supabase
      .from('current_inventory')
      .select('item_master_id, current_stock, is_low_stock, last_transaction_at')
      .eq('hos_id', hosId),
    supabase
      .from('inventory_logs')
      .select('item_master_id, expiry_date')
      .eq('hos_id', hosId)
      .eq('transaction_type', 'IN')
      .not('expiry_date', 'is', null),
  ])

  if (masterError) throw new Error(masterError.message)
  if (invError) throw new Error(invError.message)

  const invMap = new Map(
    (inventory ?? []).map((row) => [row.item_master_id, row])
  )

  // 품목별 가장 이른 유통기한
  const expiryMap = new Map<string, string>()
  for (const row of (expiryRows ?? [])) {
    if (!row.expiry_date) continue
    const cur = expiryMap.get(row.item_master_id)
    if (!cur || row.expiry_date < cur) expiryMap.set(row.item_master_id, row.expiry_date)
  }

  return (masters ?? []).map((m: any) => {
    const inv = invMap.get(m.id)
    return {
      item_master_id: m.id,
      generic_name: m.generic_name,
      category: m.category ?? [],
      loc: m.loc ?? [],
      base_unit: m.base_unit,
      default_vendor_id: m.default_vendor ?? null,
      alert_min_stock: m.alert_min_stock ?? 0,
      reorder_qty: m.reorder_qty ?? 0,
      is_active: m.is_active,
      current_stock: Number(inv?.current_stock ?? 0),
      is_low_stock: inv ? Boolean(inv.is_low_stock) : false,
      last_transaction_at: inv?.last_transaction_at ?? null,
      earliest_expiry_date: expiryMap.get(m.id) ?? null,
    } satisfies InventoryItem
  })
}

export async function getInventoryBatches(
  hosId: string,
  itemMasterId: string,
): Promise<InventoryBatch[]> {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('inventory_logs')
    .select(`
      item_product_id,
      quantity,
      transaction_type,
      created_at,
      item_products:item_product_id (
        id,
        brand_name,
        specification,
        manufacturer
      )
    `)
    .eq('hos_id', hosId)
    .eq('item_master_id', itemMasterId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const batchMap = new Map<string, InventoryBatch>()

  for (const log of (logs ?? [])) {
    const pid = log.item_product_id as string | null
    const mapKey = pid ?? NULL_BATCH_KEY
    const product = (log as any).item_products
    const existing = batchMap.get(mapKey)
    if (existing) {
      existing.current_stock += Number(log.quantity)
      if (log.transaction_type === 'IN' && log.created_at > (existing.last_in_date ?? '')) {
        existing.last_in_date = log.created_at
      }
    } else {
      batchMap.set(mapKey, {
        item_product_id: pid,
        brand_name: pid ? (product?.brand_name ?? '') : '제품 미지정',
        specification: pid ? (product?.specification ?? null) : null,
        manufacturer: pid ? (product?.manufacturer ?? null) : null,
        current_stock: Number(log.quantity),
        last_in_date: log.transaction_type === 'IN' ? log.created_at : null,
      })
    }
  }

  // 제품 지정 배치 먼저, 미지정 배치 마지막
  const batches = Array.from(batchMap.values())
  return [
    ...batches.filter((b) => b.item_product_id !== null),
    ...batches.filter((b) => b.item_product_id === null),
  ]
}

export async function getItemDetailLogs(
  hosId: string,
  itemMasterId: string,
): Promise<ProductDetailLog[]> {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('inventory_logs')
    .select(`
      id,
      item_product_id,
      transaction_type,
      quantity,
      base_unit,
      memo,
      expiry_date,
      created_at,
      item_products:item_product_id (
        id,
        brand_name,
        specification,
        manufacturer
      )
    `)
    .eq('hos_id', hosId)
    .eq('item_master_id', itemMasterId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const productMap = new Map<string, ProductDetailLog>()

  for (const log of (logs ?? [])) {
    const pid = log.item_product_id as string | null
    const mapKey = pid ?? NULL_DETAIL_KEY
    const product = (log as any).item_products

    if (!productMap.has(mapKey)) {
      productMap.set(mapKey, {
        item_product_id: pid,
        brand_name: pid ? (product?.brand_name ?? '') : '제품 미지정',
        specification: pid ? (product?.specification ?? null) : null,
        manufacturer: pid ? (product?.manufacturer ?? null) : null,
        total_in: 0,
        in_logs: [],
        out_logs: [],
        current_stock: 0,
      })
    }

    const entry = productMap.get(mapKey)!
    entry.current_stock += Number(log.quantity)

    if (log.transaction_type === 'IN') {
      entry.total_in += Number(log.quantity)
      entry.in_logs.push({
        id: log.id,
        quantity: Number(log.quantity),
        base_unit: log.base_unit,
        memo: log.memo,
        expiry_date: (log as any).expiry_date ?? null,
        created_at: log.created_at,
      })
    } else if (log.transaction_type === 'OUT') {
      entry.out_logs.push({
        id: log.id,
        quantity: Number(log.quantity),
        base_unit: log.base_unit,
        memo: log.memo,
        created_at: log.created_at,
      })
    }
  }

  const all = Array.from(productMap.values())
  return [
    ...all.filter((p) => p.item_product_id !== null),
    ...all.filter((p) => p.item_product_id === null),
  ]
}

export async function updateUsageLog(
  hosId: string,
  logId: string,
  quantity: number,
  memo: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_logs')
    .update({ quantity: -Math.abs(quantity), memo: memo.trim() || null })
    .eq('id', logId)
    .eq('hos_id', hosId)
    .eq('transaction_type', 'OUT')

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

export async function deleteUsageLog(
  hosId: string,
  logId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_logs')
    .delete()
    .eq('id', logId)
    .eq('hos_id', hosId)
    .eq('transaction_type', 'OUT')

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

export async function updateStockInLog(
  hosId: string,
  logId: string,
  quantity: number,
  memo: string,
  expiryDate?: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_logs')
    .update({
      quantity: Math.abs(quantity),
      memo: memo.trim() || null,
      expiry_date: expiryDate || null,
    })
    .eq('id', logId)
    .eq('hos_id', hosId)
    .eq('transaction_type', 'IN')

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

export async function deleteStockInLog(
  hosId: string,
  logId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_logs')
    .delete()
    .eq('id', logId)
    .eq('hos_id', hosId)
    .eq('transaction_type', 'IN')

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

export async function recordUsage(
  hosId: string,
  itemMasterId: string,
  itemProductId: string | null,
  quantity: number,
  baseUnit: string,
  memo: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('inventory_logs').insert({
    hos_id: hosId,
    item_master_id: itemMasterId,
    item_product_id: itemProductId,
    transaction_type: 'OUT',
    quantity: -Math.abs(quantity),
    base_unit: baseUnit,
    memo: memo.trim() || null,
    reference_type: 'usage',
    created_by: user?.id ?? null,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
}

export type StockInRow = {
  item_master_id: string
  item_product_id: string | null
  quantity: number
  base_unit: string
  expiry_date?: string | null
  vendor_id?: string | null
}

export async function bulkStockIn(hosId: string, rows: StockInRow[]): Promise<void> {
  if (!rows.length) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // inventory_logs 삽입
  const logs = rows.map((row) => ({
    hos_id: hosId,
    item_master_id: row.item_master_id,
    item_product_id: row.item_product_id,
    transaction_type: 'IN' as const,
    quantity: Math.abs(row.quantity),
    base_unit: row.base_unit,
    expiry_date: row.expiry_date || null,
    vendor_id: row.vendor_id ?? null,
    reference_type: 'manual_in',
    created_by: user?.id ?? null,
  }))

  const { error } = await supabase.from('inventory_logs').insert(logs)
  if (error) throw new Error(error.message)

  // item_product_id가 있는 행만 추려서 item_master 자동 연결
  // item_master_id IS NULL인 제품에만 적용 (기존 연결 덮어쓰지 않음)
  const toLink = rows.filter((r) => r.item_product_id !== null)
  for (const row of toLink) {
    await supabase
      .from('item_products')
      .update({ item_master_id: row.item_master_id })
      .eq('id', row.item_product_id!)
      .eq('hos_id', hosId)
      .is('item_master_id', null)  // 이미 연결된 경우 무시
  }

  revalidatePath(`/hospital/${hosId}/supply-order/inventory`)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

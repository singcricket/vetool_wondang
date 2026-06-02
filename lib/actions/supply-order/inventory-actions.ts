'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InventoryItem } from '@/types/hospital/supply-order-type'

export type InventoryBatch = {
  item_product_id: string
  brand_name: string
  specification: string | null
  manufacturer: string | null
  current_stock: number
  last_in_date: string | null
}

export type UsageLogEntry = {
  id: string
  quantity: number
  base_unit: string
  memo: string | null
  created_at: string
}

export type ProductDetailLog = {
  item_product_id: string
  brand_name: string
  specification: string | null
  manufacturer: string | null
  total_in: number
  in_logs: Array<{ id: string; quantity: number; created_at: string }>
  out_logs: UsageLogEntry[]
  current_stock: number
}

export async function getInventoryStatus(hosId: string): Promise<InventoryItem[]> {
  const supabase = await createClient()

  const { data: masters, error: masterError } = await supabase
    .from('item_master')
    .select('id, generic_name, category, loc, base_unit, default_vendor, alert_min_stock, reorder_qty, is_active')
    .eq('hos_id', hosId)
    .eq('is_active', true)
    .order('generic_name')

  if (masterError) throw new Error(masterError.message)

  const { data: inventory, error: invError } = await supabase
    .from('current_inventory')
    .select('item_master_id, current_stock, is_low_stock, last_transaction_at')
    .eq('hos_id', hosId)

  if (invError) throw new Error(invError.message)

  const invMap = new Map(
    (inventory ?? []).map((row) => [row.item_master_id, row])
  )

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
    .not('item_product_id', 'is', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const batchMap = new Map<string, InventoryBatch>()

  for (const log of (logs ?? [])) {
    const pid = log.item_product_id as string
    const product = (log as any).item_products
    const existing = batchMap.get(pid)
    if (existing) {
      existing.current_stock += Number(log.quantity)
      if (log.transaction_type === 'IN' && log.created_at > (existing.last_in_date ?? '')) {
        existing.last_in_date = log.created_at
      }
    } else {
      batchMap.set(pid, {
        item_product_id: pid,
        brand_name: product?.brand_name ?? '',
        specification: product?.specification ?? null,
        manufacturer: product?.manufacturer ?? null,
        current_stock: Number(log.quantity),
        last_in_date: log.transaction_type === 'IN' ? log.created_at : null,
      })
    }
  }

  return Array.from(batchMap.values())
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
    .not('item_product_id', 'is', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const productMap = new Map<string, ProductDetailLog>()

  for (const log of (logs ?? [])) {
    const pid = log.item_product_id as string
    const product = (log as any).item_products

    if (!productMap.has(pid)) {
      productMap.set(pid, {
        item_product_id: pid,
        brand_name: product?.brand_name ?? '',
        specification: product?.specification ?? null,
        manufacturer: product?.manufacturer ?? null,
        total_in: 0,
        in_logs: [],
        out_logs: [],
        current_stock: 0,
      })
    }

    const entry = productMap.get(pid)!
    entry.current_stock += Number(log.quantity)

    if (log.transaction_type === 'IN') {
      entry.total_in += Number(log.quantity)
      entry.in_logs.push({ id: log.id, quantity: Number(log.quantity), created_at: log.created_at })
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

  return Array.from(productMap.values())
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

export async function recordUsage(
  hosId: string,
  itemMasterId: string,
  itemProductId: string,
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

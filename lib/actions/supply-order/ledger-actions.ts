'use server'

import { createClient } from '@/lib/supabase/server'

export type LedgerProduct = {
  item_product_id: string
  brand_name: string
  manufacturer: string | null
  specification: string | null
  category: string[]
  tag: string[]
  item_master_id: string | null
  generic_name: string | null      // 약품성분 대용
  base_unit: string
  log_count: number
}

export type LedgerEntry = {
  id: string
  date: string                      // created_at의 날짜 부분
  transaction_type: 'IN' | 'OUT'
  quantity: number
  base_unit: string
  vendor_name: string | null        // 구매처
  expiry_date: string | null
  lot_number: string | null
  memo: string | null
  running_balance: number           // 재고량 (누적)
}

export type LedgerDetail = {
  product: LedgerProduct
  opening_stock: number             // 기간 시작 전 재고
  entries: LedgerEntry[]
}

// 조회 기간 내 입/출고 기록이 있는 item_product 목록
export async function getLedgerProducts(
  hosId: string,
  fromDate: string,
  toDate: string,
): Promise<LedgerProduct[]> {
  const supabase = await createClient()

  // 기간 내 inventory_logs의 item_product_id 집계
  const { data: logs, error } = await supabase
    .from('inventory_logs')
    .select('item_product_id')
    .eq('hos_id', hosId)
    .gte('created_at', `${fromDate}T00:00:00`)
    .lte('created_at', `${toDate}T23:59:59`)
    .not('item_product_id', 'is', null)

  if (error) throw new Error(error.message)

  const productIds = [...new Set((logs ?? []).map((l) => l.item_product_id as string))]
  if (!productIds.length) return []

  const { data: products, error: pErr } = await supabase
    .from('item_products')
    .select(`
      id,
      brand_name,
      manufacturer,
      specification,
      category,
      tag,
      item_master_id,
      item_master:item_master_id (
        generic_name,
        base_unit
      )
    `)
    .in('id', productIds)
    .eq('hos_id', hosId)
    .order('brand_name')

  if (pErr) throw new Error(pErr.message)

  return (products ?? []).map((p: any) => ({
    item_product_id: p.id,
    brand_name: p.brand_name,
    manufacturer: p.manufacturer ?? null,
    specification: p.specification ?? null,
    category: p.category ?? [],
    tag: p.tag ?? [],
    item_master_id: p.item_master_id ?? null,
    generic_name: p.item_master?.generic_name ?? null,
    base_unit: p.item_master?.base_unit ?? '개',
    log_count: logs!.filter((l) => l.item_product_id === p.id).length,
  }))
}

// 특정 item_product의 수불대장 상세 (기간 시작 기초재고 + 기간 내 거래내역)
export async function getLedgerDetail(
  hosId: string,
  itemProductId: string,
  fromDate: string,
  toDate: string,
): Promise<LedgerDetail> {
  const supabase = await createClient()

  // 제품 정보
  const { data: product, error: pErr } = await supabase
    .from('item_products')
    .select(`
      id,
      brand_name,
      manufacturer,
      specification,
      category,
      tag,
      item_master_id,
      item_master:item_master_id (
        generic_name,
        base_unit
      )
    `)
    .eq('id', itemProductId)
    .eq('hos_id', hosId)
    .single()

  if (pErr || !product) throw new Error('제품을 찾을 수 없습니다.')

  const p = product as any
  const ledgerProduct: LedgerProduct = {
    item_product_id: p.id,
    brand_name: p.brand_name,
    manufacturer: p.manufacturer ?? null,
    specification: p.specification ?? null,
    category: p.category ?? [],
    tag: p.tag ?? [],
    item_master_id: p.item_master_id ?? null,
    generic_name: p.item_master?.generic_name ?? null,
    base_unit: p.item_master?.base_unit ?? '개',
    log_count: 0,
  }

  // 기간 시작 전 재고 (기초재고)
  const { data: beforeLogs } = await supabase
    .from('inventory_logs')
    .select('quantity, transaction_type')
    .eq('hos_id', hosId)
    .eq('item_product_id', itemProductId)
    .lt('created_at', `${fromDate}T00:00:00`)

  const openingStock = (beforeLogs ?? []).reduce(
    (sum, l) => sum + Number(l.quantity),
    0,
  )

  // 기간 내 거래내역 (vendor join)
  const { data: periodLogs, error: lErr } = await supabase
    .from('inventory_logs')
    .select(`
      id,
      created_at,
      transaction_type,
      quantity,
      base_unit,
      expiry_date,
      memo,
      vendors:vendor_id (
        name
      )
    `)
    .eq('hos_id', hosId)
    .eq('item_product_id', itemProductId)
    .gte('created_at', `${fromDate}T00:00:00`)
    .lte('created_at', `${toDate}T23:59:59`)
    .order('created_at', { ascending: true })

  if (lErr) throw new Error(lErr.message)

  // 누적 재고량 계산
  let balance = openingStock
  const entries: LedgerEntry[] = (periodLogs ?? []).map((l: any) => {
    balance += Number(l.quantity)
    return {
      id: l.id,
      date: l.created_at.split('T')[0],
      transaction_type: l.transaction_type as 'IN' | 'OUT',
      quantity: Math.abs(Number(l.quantity)),
      base_unit: l.base_unit,
      vendor_name: (l.vendors as any)?.name ?? null,
      expiry_date: l.expiry_date ?? null,
      lot_number: null,
      memo: l.memo ?? null,
      running_balance: balance,
    }
  })

  return { product: ledgerProduct, opening_stock: openingStock, entries }
}

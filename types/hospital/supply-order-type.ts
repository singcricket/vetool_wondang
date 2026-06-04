// ── Vendor ────────────────────────────────────────────────────

export type VendorContact = {
  name: string
  phone: string
  memo: string
}

export type Vendor = {
  id: string
  hos_id: string
  name: string
  categories: string[]
  representative: string | null
  representative_phone: string | null
  contacts: VendorContact[]
  address: string | null
  memo: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VendorFormInput = {
  name: string
  categories: string[]
  representative: string
  representative_phone: string
  contacts: VendorContact[]
  address: string
  memo: string
  is_active: boolean
}

// ── Item Master ───────────────────────────────────────────────

export const ITEM_CATEGORIES = [
  '주사제',
  '수액제',
  '경구제',
  '항암제',
  '흡입제',
  '향정',
  '안약',
  '연고',
  '시럽',
  '보조제',
  '의료소모품',
  '검사소모품',
  '진단키트',
  '장비소모품',
  '예방의학',
  '기타',
  '사료',
  '용품'
] as const

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export type ItemMaster = {
  id: string
  hos_id: string
  category: string[]     // 카테고리 배열 (복수 가능)
  generic_name: string
  ingredient: string[]   // 성분명 배열
  description: string | null
  base_unit: string
  aliases: string[]
  loc: string[]          // 태그 배열 (장소·분류 등 자유 사용)
  default_vendor: string | null  // 기본 주문업체 (vendors.id)
  alert_min_stock: number
  reorder_qty: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ItemMasterFormInput = {
  category: string[]     // 카테고리 배열 (복수 가능)
  generic_name: string
  ingredient: string[]   // 성분명 배열
  description: string
  base_unit: string
  aliases: string[]
  loc: string[]          // 태그 배열 (장소·분류 등 자유 사용)
  default_vendor: string // 기본 주문업체 (vendors.id, 미선택 시 '')
  alert_min_stock: number
  reorder_qty: number
  is_active: boolean
}

// ── Delivery ──────────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'reviewing' | 'confirmed' | 'partial' | 'returned'

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending:   '확인대기',
  reviewing: '검토중',
  confirmed: '확인완료',
  partial:   '부분확인',
  returned:  '반품처리',
}

export const DELIVERY_STATUS_COLOR: Record<DeliveryStatus, string> = {
  pending:   'bg-slate-100 text-slate-600',
  reviewing: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  partial:   'bg-orange-100 text-orange-700',
  returned:  'bg-rose-100 text-rose-700',
}

export type Delivery = {
  id: string
  hos_id: string
  vendor_id: string
  order_id: string | null
  delivery_date: string
  status: DeliveryStatus
  source_type: 'manual' | 'excel' | 'image'
  source_file_url: string | null
  received_by: string | null
  vendor_deliverer: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export type DeliveryFormInput = {
  delivery_date: string
  vendor_deliverer: string
  memo: string
}

// ── Delivery Items ────────────────────────────────────────────

export type DeliveryItemMappingStatus = 'pending' | 'ai_suggested' | 'mapped' | 'new_product' | 'skipped'

export type DeliveryItem = {
  id: string
  delivery_id: string
  raw_name: string
  raw_spec: string | null
  raw_manufacturer: string | null
  raw_quantity: string | null
  item_product_id: string | null
  item_master_id: string | null
  quantity_received: number
  unit: string
  units_per_package: number
  base_quantity: number | null
  unit_price: number | null
  expiry_date: string | null
  lot_number: string | null
  mapping_status: DeliveryItemMappingStatus
  mapping_confidence: number | null
  ai_suggestion: unknown | null
  memo: string | null
  created_at: string
  updated_at: string
  // joined
  item_master?: Pick<ItemMaster, 'id' | 'generic_name' | 'category' | 'base_unit'> | null
  item_product?: Pick<ItemProduct, 'id' | 'brand_name' | 'manufacturer'> | null
}

export type DeliveryItemFormInput = {
  item_master_id: string
  item_product_id: string
  quantity_received: number
  unit: string
  units_per_package: number
  unit_price: string
  expiry_date: string
  lot_number: string
  memo: string
}

// ── Bulk Upload — item_master ─────────────────────────────────

export type ItemMasterCsvRow = {
  category: string
  generic_name: string
  ingredient?: string    // 세미콜론(;) 구분 → 배열로 파싱
  description?: string
  base_unit: string
  aliases?: string       // 세미콜론(;) 구분 → 배열로 파싱
  loc?: string           // 세미콜론(;) 구분 → 배열로 파싱
  alert_min_stock?: string
  reorder_qty?: string
}

// ── Orders ────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  'draft',
  'ordered',
  'confirmed',
  'delivering',
  'delivered',
  'partial',
  'returned',
  'rejected',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft:      '작성중',
  ordered:    '주문완료',
  confirmed:  '도매상확인',
  delivering: '배송중',
  delivered:  '납품완료',
  partial:    '부분납품',
  returned:   '반품',
  rejected:   '반려',
  cancelled:  '취소',
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  draft:      'bg-slate-100 text-slate-600',
  ordered:    'bg-blue-100 text-blue-700',
  confirmed:  'bg-indigo-100 text-indigo-700',
  delivering: 'bg-amber-100 text-amber-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  partial:    'bg-orange-100 text-orange-700',
  returned:   'bg-rose-100 text-rose-700',
  rejected:   'bg-red-100 text-red-700',
  cancelled:  'bg-slate-100 text-slate-400',
}

export const ORDER_ITEM_STATUSES = ['pending', 'confirmed', 'cancelled', 'on_hold', 'delayed', 'returned', 'out_of_stock', 'discontinued'] as const
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number]

export const ORDER_ITEM_STATUS_LABEL: Record<OrderItemStatus, string> = {
  pending:       '미확인',
  confirmed:     '확인',
  cancelled:     '취소',
  on_hold:       '보류',
  delayed:       '지연',
  returned:      '반품',
  out_of_stock:  '품절',
  discontinued:  '단종',
}

export const ORDER_ITEM_STATUS_COLOR: Record<OrderItemStatus, string> = {
  pending:       'bg-slate-100 text-slate-500',
  confirmed:     'bg-emerald-100 text-emerald-700',
  cancelled:     'bg-red-100 text-red-600',
  on_hold:       'bg-orange-100 text-orange-600',
  delayed:       'bg-amber-100 text-amber-700',
  returned:      'bg-rose-100 text-rose-700',
  out_of_stock:  'bg-purple-100 text-purple-600',
  discontinued:  'bg-zinc-100 text-zinc-600',
}

export type OrderItem = {
  id: string
  order_id: string
  item_master_id: string
  quantity: number
  unit: string
  units_per_order_unit: number
  unit_price: number | null
  item_status: OrderItemStatus
  memo: string | null
  created_at: string
  // joined
  item_master?: Pick<ItemMaster, 'id' | 'generic_name' | 'category' | 'base_unit'>
}

export type Order = {
  id: string
  hos_id: string
  vendor_id: string
  order_date: string
  status: OrderStatus
  order_handler_id: string | null
  vendor_contact: string | null
  memo: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  vendor?: Pick<Vendor, 'id' | 'name' | 'categories'>
  order_items?: OrderItem[]
}

export type OrderFormInput = {
  order_date: string
  vendor_contact: string
  memo: string
  items: {
    item_master_id: string
    quantity: number
    unit: string
    units_per_order_unit: number
    unit_price: string
    memo: string
  }[]
}

// ── Inventory ─────────────────────────────────────────────────

export type InventoryItem = {
  item_master_id: string
  generic_name: string
  category: string[]
  loc: string[]
  base_unit: string
  default_vendor_id: string | null
  alert_min_stock: number
  reorder_qty: number
  is_active: boolean
  current_stock: number
  is_low_stock: boolean
  last_transaction_at: string | null
  earliest_expiry_date: string | null
}

// ── Delivery Upload / Review ──────────────────────────────────

export type ExtractedDeliveryItem = {
  raw_name: string
  raw_spec: string | null
  raw_manufacturer: string | null
  quantity_received: number
  unit: string
  unit_price: number | null
  expiry_date: string | null
  lot_number: string | null
}

export type ReviewItemMatchStatus = 'matched' | 'ai_suggested' | 'unmatched'
export type ReviewItemDecision = 'confirm' | 'skip' | 'new_product'

export type ReviewDeliveryItem = ExtractedDeliveryItem & {
  _id: string
  match_status: ReviewItemMatchStatus
  match_confidence: number | null
  matched_product_id: string | null
  decision: ReviewItemDecision
}

// ── Inventory Upload / Review ─────────────────────────────────

export type ReviewInventoryItem = ExtractedDeliveryItem & {
  _id: string
  match_status: ReviewItemMatchStatus
  match_confidence: number | null
  matched_product_id: string | null
  item_master_id: string | null          // resolved via matched product
  decision: 'confirm' | 'skip' | 'new_product'
  // inline new product fields
  new_brand_name?: string
  new_spec?: string
  new_manufacturer?: string
  // master linkage
  pending_master_id?: string             // pick existing master
  new_master_name?: string               // create new master
  new_master_base_unit?: string
}

// ── Bulk Upload — item_products ───────────────────────────────

export type ItemProductCsvRow = {
  brand_name: string
  manufacturer?: string
  ingredient?: string    // 세미콜론(;) 구분 (제품 자체 성분, 선택)
  specification?: string
  package_type?: string
  units_per_package?: string
  reference_price?: string
  category?: string      // 세미콜론(;) 구분 → 배열
  tag?: string           // 세미콜론(;) 구분 → 배열
  memo?: string
}

// ── Item Product ──────────────────────────────────────────────

export type ItemProduct = {
  id: string
  hos_id: string
  item_master_id: string | null   // 대량 업로드 후 연결 전 null 가능
  brand_name: string
  manufacturer: string | null
  ingredient: string | null
  specification: string | null
  package_type: string
  units_per_package: number
  reference_price: number | null
  vendor_ids: string[]             // 공급 도매상 ID 목록
  category: string[]
  tag: string[]
  memo: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  item_master?: Pick<ItemMaster, 'id' | 'generic_name' | 'category' | 'base_unit'> | null
}

export type ItemProductFormInput = {
  item_master_id: string   // 폼에서는 선택 필수 (수정 시 연결)
  brand_name: string
  manufacturer: string
  ingredient: string
  specification: string
  package_type: string
  units_per_package: number
  reference_price: string
  category: string[]
  tag: string[]
  vendor_ids: string[]
  memo: string
  is_active: boolean
}

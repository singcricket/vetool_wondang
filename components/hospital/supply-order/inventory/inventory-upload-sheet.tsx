'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Camera, FileSpreadsheet, Loader2, Save, CheckCircle2,
  AlertTriangle, X, Search, Package, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  extractFromInvoicePhoto,
  parseDeliveryExcel,
  matchItemsForInventory,
  saveInventoryUploadItems,
} from '@/lib/actions/supply-order/inventory-upload-actions'
import type { ItemProduct, InventoryItem, ReviewInventoryItem } from '@/types/hospital/supply-order-type'
import { ITEM_CATEGORIES } from '@/types/hospital/supply-order-type'

type Step = 'idle' | 'analyzing' | 'review'
type InventoryCase = 'matched' | 'case1' | 'case2' | 'case3'
// matched: product + master both exist
// case1  : neither exists → create master + product
// case2  : master exists, product not → create product (auto-link to master)
// case3  : product exists, master not → create master (link to product)

type ReviewRow = {
  _id: string
  rawName: string
  rawSpec: string | null
  rawManufacturer: string | null
  matchStatus: ReviewInventoryItem['match_status']
  matchConfidence: number | null
  inventoryCase: InventoryCase
  // existing product (matched, case3)
  productId: string | null
  productBrandName: string
  // existing/suggested master (matched, case2)
  masterId: string | null
  masterName: string
  // case3: create or pick existing master
  masterMode: 'create' | 'pick'
  masterPickerQuery: string
  pendingMasterId: string
  // new product fields (case1, case2)
  newBrandName: string
  newSpec: string
  newManufacturer: string
  // new master fields (case1, case3 create)
  newMasterName: string
  newMasterBaseUnit: string
  newMasterCategory: string[]
  newMasterAliases: string    // 세미콜론 구분 입력 → 저장 시 배열 변환
  newMasterLoc: string        // 세미콜론 구분 입력 → 저장 시 배열 변환
  // quantities
  quantity: string
  unit: string
  unitPrice: string
  expiryDate: string
  lotNumber: string
  skipped: boolean
  expanded: boolean
}

interface Props {
  hosId: string
  itemProducts: ItemProduct[]
  inventoryItems: InventoryItem[]
  vendors: { id: string; name: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── MasterSearchCombobox ──────────────────────────────────────

function MasterSearchCombobox({
  items, value, query, onQueryChange, onSelect,
}: {
  items: InventoryItem[]
  value: string
  query: string
  onQueryChange: (q: string) => void
  onSelect: (id: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find((i) => i.item_master_id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 20)
    return items.filter((i) => i.generic_name.toLowerCase().includes(q)).slice(0, 20)
  }, [items, query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={selected && !open ? selected.generic_name : query}
          onChange={(e) => { onQueryChange(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); if (selected) onQueryChange('') }}
          placeholder="품목 마스터 검색..."
          className="h-7 w-full rounded-md border border-slate-200 bg-white pl-6 pr-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-8 z-50 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[11px] text-slate-400">검색 결과 없음</p>
          ) : (
            filtered.map((i) => (
              <button
                key={i.item_master_id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(i.item_master_id, i.generic_name); onQueryChange(''); setOpen(false) }}
                className={cn(
                  'flex w-full flex-col px-3 py-1.5 text-left text-[11px] hover:bg-teal-50',
                  value === i.item_master_id && 'bg-teal-50',
                )}
              >
                <span className="font-medium text-slate-800">{i.generic_name}</span>
                <span className="text-slate-400">{i.base_unit} · 재고 {i.current_stock}{i.base_unit}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── isRowReady ────────────────────────────────────────────────

// ── NewMasterCategoryPicker ───────────────────────────────────

function NewMasterCategoryPicker({
  value, onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (cat: string) =>
    onChange(value.includes(cat) ? value.filter((c) => c !== cat) : [...value, cat])

  return (
    <div className="space-y-1">
      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">카테고리</p>
      <div className="flex flex-wrap gap-1">
        {ITEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] transition',
              value.includes(cat)
                ? 'border-teal-400 bg-teal-50 text-teal-700 font-semibold'
                : 'border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600',
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

function isRowReady(r: ReviewRow): boolean {
  if (r.skipped) return false
  if (Number(r.quantity) <= 0) return false
  switch (r.inventoryCase) {
    case 'matched': return true
    case 'case2':   return r.newBrandName.trim().length > 0 && r.masterId != null
    case 'case3':
      if (r.masterMode === 'create') return r.newMasterName.trim().length > 0
      return r.pendingMasterId.length > 0
    case 'case1':   return r.newMasterName.trim().length > 0
  }
}

// ── ReviewRowCard ─────────────────────────────────────────────

function ReviewRowCard({
  row, inventoryItems, onUpdate,
}: {
  row: ReviewRow
  inventoryItems: InventoryItem[]
  onUpdate: (patch: Partial<ReviewRow>) => void
}) {
  const caseBadge = (() => {
    switch (row.inventoryCase) {
      case 'matched':
        return (
          <span className="flex items-center gap-0.5 rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-600">
            <CheckCircle2 size={8} />
            매칭됨{row.matchConfidence ? ` ${Math.round(row.matchConfidence * 100)}%` : ''}
          </span>
        )
      case 'case2':
        return (
          <span className="flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">
            <Package size={8} />
            제품 등록 필요
          </span>
        )
      case 'case3':
        return (
          <span className="flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">
            <Layers size={8} />
            마스터 등록 필요
          </span>
        )
      case 'case1':
        return (
          <span className="flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-500">
            <AlertTriangle size={8} />
            신규 등록 필요
          </span>
        )
    }
  })()

  const ready = isRowReady(row)

  return (
    <div className={cn('flex flex-col gap-0 px-4 py-3 transition-opacity', row.skipped && 'opacity-40')}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-800 truncate">{row.rawName}</span>
            {caseBadge}
            {!ready && !row.skipped && (
              <span className="text-[9px] text-amber-400">미완성</span>
            )}
          </div>
          {(row.rawSpec || row.rawManufacturer) && (
            <p className="text-[10px] text-slate-400">
              {[row.rawManufacturer, row.rawSpec].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdate({ expanded: !row.expanded })}
            className="rounded p-0.5 text-slate-300 hover:text-slate-500 text-[10px]"
          >
            {row.expanded ? '▲' : '▼'}
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ skipped: !row.skipped })}
            className={cn(
              'rounded p-0.5 text-slate-300 hover:text-slate-500',
              row.skipped && 'text-rose-400 hover:text-rose-500',
            )}
            title={row.skipped ? '포함하기' : '건너뛰기'}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!row.skipped && row.expanded && (
        <div className="mt-2 flex flex-col gap-2.5">

          {/* ── matched: 기존 제품/마스터 표시 ── */}
          {row.inventoryCase === 'matched' && (
            <div className="rounded-md bg-teal-50 border border-teal-100 px-3 py-2 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Package size={11} className="text-teal-500 shrink-0" />
                <span className="text-[11px] font-semibold text-teal-700">{row.productBrandName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers size={11} className="text-teal-500 shrink-0" />
                <span className="text-[11px] text-teal-600">{row.masterName}</span>
              </div>
            </div>
          )}

          {/* ── case2: 마스터 표시 (자동연결) + 제품 입력 ── */}
          {row.inventoryCase === 'case2' && (
            <>
              <div className="rounded-md bg-teal-50 border border-teal-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Layers size={11} className="text-teal-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-teal-700">{row.masterName}</span>
                  <span className="text-[9px] text-teal-400 ml-auto">자동 연결됨</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-500">신규 제품 등록</p>
                <Input
                  value={row.newBrandName}
                  onChange={(e) => onUpdate({ newBrandName: e.target.value })}
                  placeholder="브랜드명 *"
                  className="h-7 text-xs"
                />
                <div className="grid grid-cols-2 gap-1">
                  <Input value={row.newSpec} onChange={(e) => onUpdate({ newSpec: e.target.value })} placeholder="규격" className="h-7 text-xs" />
                  <Input value={row.newManufacturer} onChange={(e) => onUpdate({ newManufacturer: e.target.value })} placeholder="제조사" className="h-7 text-xs" />
                </div>
              </div>
            </>
          )}

          {/* ── case3: 제품 표시 + 마스터 생성 or 연결 ── */}
          {row.inventoryCase === 'case3' && (
            <>
              <div className="rounded-md bg-indigo-50 border border-indigo-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Package size={11} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-indigo-700">{row.productBrandName}</span>
                  <span className="text-[9px] text-indigo-300 ml-auto">기존 제품</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-slate-500">품목 마스터</p>
                  <button
                    type="button"
                    onClick={() => onUpdate({
                      masterMode: row.masterMode === 'create' ? 'pick' : 'create',
                      pendingMasterId: '',
                      masterPickerQuery: '',
                    })}
                    className="text-[10px] text-slate-400 hover:text-teal-500"
                  >
                    {row.masterMode === 'create' ? '기존 마스터 연결' : '+ 새로 만들기'}
                  </button>
                </div>
                {row.masterMode === 'create' ? (
                  <div className="space-y-1.5 rounded-md border border-dashed border-teal-200 bg-teal-50/50 p-2">
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        value={row.newMasterName}
                        onChange={(e) => onUpdate({ newMasterName: e.target.value })}
                        placeholder="일반명 *"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={row.newMasterBaseUnit}
                        onChange={(e) => onUpdate({ newMasterBaseUnit: e.target.value })}
                        placeholder="기본 단위 (정, 앰플…)"
                        className="h-7 text-xs"
                      />
                    </div>
                    <NewMasterCategoryPicker
                      value={row.newMasterCategory}
                      onChange={(v) => onUpdate({ newMasterCategory: v })}
                    />
                    <Input
                      value={row.newMasterAliases}
                      onChange={(e) => onUpdate({ newMasterAliases: e.target.value })}
                      placeholder="별칭 (세미콜론; 구분)"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={row.newMasterLoc}
                      onChange={(e) => onUpdate({ newMasterLoc: e.target.value })}
                      placeholder="태그 (세미콜론; 구분, 예: 냉장;주사실)"
                      className="h-7 text-xs"
                    />
                  </div>
                ) : (
                  <MasterSearchCombobox
                    items={inventoryItems}
                    value={row.pendingMasterId}
                    query={row.masterPickerQuery}
                    onQueryChange={(q) => onUpdate({ masterPickerQuery: q })}
                    onSelect={(id, name) => onUpdate({ pendingMasterId: id, masterPickerQuery: name })}
                  />
                )}
              </div>
            </>
          )}

          {/* ── case1: 마스터 + 제품 모두 신규 ── */}
          {row.inventoryCase === 'case1' && (
            <>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-500">품목 마스터 (일반명)</p>
                <div className="space-y-1.5 rounded-md border border-dashed border-teal-200 bg-teal-50/50 p-2">
                  <div className="grid grid-cols-2 gap-1">
                    <Input
                      value={row.newMasterName}
                      onChange={(e) => onUpdate({ newMasterName: e.target.value })}
                      placeholder="일반명 * (예: 아목시실린)"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={row.newMasterBaseUnit}
                      onChange={(e) => onUpdate({ newMasterBaseUnit: e.target.value })}
                      placeholder="기본 단위 (정, 앰플…)"
                      className="h-7 text-xs"
                    />
                  </div>
                  <NewMasterCategoryPicker
                    value={row.newMasterCategory}
                    onChange={(v) => onUpdate({ newMasterCategory: v })}
                  />
                  <Input
                    value={row.newMasterAliases}
                    onChange={(e) => onUpdate({ newMasterAliases: e.target.value })}
                    placeholder="별칭 (세미콜론; 구분)"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={row.newMasterLoc}
                    onChange={(e) => onUpdate({ newMasterLoc: e.target.value })}
                    placeholder="태그 (세미콜론; 구분, 예: 냉장;주사실)"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-500">제품 정보</p>
                <div className="space-y-1 rounded-md border border-dashed border-indigo-200 bg-indigo-50/50 p-2">
                  <Input
                    value={row.newBrandName}
                    onChange={(e) => onUpdate({ newBrandName: e.target.value })}
                    placeholder="브랜드명 (비워두면 원본명 사용)"
                    className="h-7 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <Input value={row.newSpec} onChange={(e) => onUpdate({ newSpec: e.target.value })} placeholder="규격" className="h-7 text-xs" />
                    <Input value={row.newManufacturer} onChange={(e) => onUpdate({ newManufacturer: e.target.value })} placeholder="제조사" className="h-7 text-xs" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 수량 + 단가 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500">수량 *</p>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.quantity}
                  onChange={(e) => onUpdate({ quantity: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="0"
                />
                <span className="shrink-0 text-[11px] text-slate-400">{row.unit}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500">단가 (원)</p>
              <Input
                type="number"
                min={0}
                value={row.unitPrice}
                onChange={(e) => onUpdate({ unitPrice: e.target.value })}
                className="h-7 text-xs"
                placeholder="0"
              />
            </div>
          </div>

          {/* 유통기한 + 로트 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500">유통기한</p>
              <Input
                type="date"
                value={row.expiryDate}
                onChange={(e) => onUpdate({ expiryDate: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500">로트번호</p>
              <Input
                value={row.lotNumber}
                onChange={(e) => onUpdate({ lotNumber: e.target.value })}
                placeholder="LOT-XXXXX"
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* collapsed 요약 */}
      {!row.skipped && !row.expanded && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          {(() => {
            switch (row.inventoryCase) {
              case 'matched':
                return <span className="text-teal-500">{row.productBrandName} → {row.masterName}</span>
              case 'case2':
                return (
                  <>
                    <span className={row.newBrandName ? 'text-indigo-500' : 'text-rose-400'}>
                      {row.newBrandName || '브랜드명 입력 필요'}
                    </span>
                    <span>→</span>
                    <span className="text-teal-500">{row.masterName}</span>
                  </>
                )
              case 'case3':
                return (
                  <>
                    <span className="text-indigo-500">{row.productBrandName}</span>
                    <span>→</span>
                    <span className={row.newMasterName || row.pendingMasterId ? 'text-teal-500' : 'text-rose-400'}>
                      {row.newMasterName || (row.pendingMasterId ? '마스터 선택됨' : '마스터 입력 필요')}
                    </span>
                  </>
                )
              case 'case1':
                return (
                  <span className={row.newMasterName ? 'text-slate-500' : 'text-rose-400'}>
                    {row.newMasterName || '마스터명 입력 필요'}
                  </span>
                )
            }
          })()}
          <span>·</span>
          <span>{row.quantity} {row.unit}</span>
        </div>
      )}
    </div>
  )
}

// ── buildRows ─────────────────────────────────────────────────

function buildRows(items: ReviewInventoryItem[], allProducts: ItemProduct[]): ReviewRow[] {
  return items.map((item) => {
    const product = allProducts.find((p) => p.id === item.matched_product_id)

    let inventoryCase: InventoryCase
    if (item.matched_product_id && item.item_master_id) {
      inventoryCase = 'matched'
    } else if (!item.matched_product_id && item.suggested_master_id) {
      inventoryCase = 'case2'
    } else if (item.matched_product_id && !item.item_master_id) {
      inventoryCase = 'case3'
    } else {
      inventoryCase = 'case1'
    }

    const masterId = inventoryCase === 'matched'
      ? item.item_master_id
      : inventoryCase === 'case2'
        ? item.suggested_master_id
        : null

    const masterName = inventoryCase === 'matched'
      ? (product?.item_master?.generic_name ?? '')
      : inventoryCase === 'case2'
        ? (item.suggested_master_name ?? '')
        : ''

    return {
      _id: item._id,
      rawName: item.raw_name,
      rawSpec: item.raw_spec,
      rawManufacturer: item.raw_manufacturer,
      matchStatus: item.match_status,
      matchConfidence: item.match_confidence,
      inventoryCase,
      productId: item.matched_product_id,
      productBrandName: product?.brand_name ?? '',
      masterId,
      masterName,
      masterMode: 'create',
      masterPickerQuery: '',
      pendingMasterId: '',
      newBrandName: item.raw_name,
      newSpec: item.raw_spec ?? '',
      newManufacturer: item.raw_manufacturer ?? '',
      newMasterName: '',
      newMasterBaseUnit: '',
      newMasterCategory: [],
      newMasterAliases: '',
      newMasterLoc: '',
      quantity: String(item.quantity_received),
      unit: item.unit || '개',
      unitPrice: item.unit_price != null ? String(item.unit_price) : '',
      expiryDate: item.expiry_date ?? '',
      lotNumber: item.lot_number ?? '',
      skipped: false,
      expanded: inventoryCase !== 'matched',  // matched는 collapsed, 나머지는 expanded
    }
  })
}

// ── Main component ────────────────────────────────────────────

export default function InventoryUploadSheet({ hosId, itemProducts, inventoryItems, vendors, open, onOpenChange }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const excelRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('idle')
  const [analyzeMsg, setAnalyzeMsg] = useState('')
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [saving, setSaving] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState('')

  const update = (id: string, patch: Partial<ReviewRow>) =>
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...patch } : r)))

  const reset = () => { setStep('idle'); setRows([]); setAnalyzeMsg(''); setSelectedVendorId('') }

  const filteredProducts = useMemo(() => {
    if (!selectedVendorId) return itemProducts
    const vendorProducts = itemProducts.filter((p) => (p.vendor_ids ?? []).includes(selectedVendorId))
    return vendorProducts.length > 0 ? vendorProducts : itemProducts
  }, [itemProducts, selectedVendorId])

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1600
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
      }
      img.onerror = reject
      img.src = url
    })

  const handleImages = async (files: FileList) => {
    if (!files.length) return
    setStep('analyzing')
    setAnalyzeMsg('이미지 분석 중...')
    try {
      const allExtracted: Awaited<ReturnType<typeof extractFromInvoicePhoto>> = []
      for (const file of Array.from(files)) {
        const base64 = await compressImage(file)
        const extracted = await extractFromInvoicePhoto(base64, 'image/jpeg')
        allExtracted.push(...extracted)
      }
      if (!allExtracted.length) {
        toast.error('품목을 추출하지 못했습니다. 다른 이미지를 시도해주세요.')
        setStep('idle')
        return
      }
      setAnalyzeMsg(`${allExtracted.length}개 품목 매칭 중...`)
      const matched = await matchItemsForInventory(allExtracted, filteredProducts, inventoryItems, selectedVendorId || undefined)
      setRows(buildRows(matched, filteredProducts))
      setStep('review')
    } catch (e) {
      toast.error('분석 중 오류가 발생했습니다.')
      console.error(e)
      setStep('idle')
    }
  }

  const handleExcel = async (file: File) => {
    setStep('analyzing')
    setAnalyzeMsg('엑셀 분석 중...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const extracted = await parseDeliveryExcel(formData)
      if (!extracted.length) {
        toast.error('품목을 찾지 못했습니다. 헤더 행(제품명/수량 등)이 있는지 확인해주세요.')
        setStep('idle')
        return
      }
      setAnalyzeMsg(`${extracted.length}개 품목 매칭 중...`)
      const matched = await matchItemsForInventory(extracted, filteredProducts, inventoryItems, selectedVendorId || undefined)
      setRows(buildRows(matched, filteredProducts))
      setStep('review')
    } catch (e) {
      toast.error('엑셀 파일 처리 중 오류가 발생했습니다.')
      console.error(e)
      setStep('idle')
    }
  }

  const activeRows = rows.filter((r) => !r.skipped)
  const readyRows = activeRows.filter(isRowReady)
  const notReadyRows = activeRows.filter((r) => !isRowReady(r))

  const handleSave = async () => {
    if (!readyRows.length) { toast.error('저장할 수 있는 품목이 없습니다.'); return }
    if (readyRows.some((r) => Number(r.quantity) <= 0)) {
      toast.error('수량이 0인 품목이 있습니다.')
      return
    }

    try {
      setSaving(true)
      const saveRows = readyRows.map((r) => {
        let masterId: string | null = null
        let masterIsNew = false

        switch (r.inventoryCase) {
          case 'matched':
          case 'case2':
            masterId = r.masterId
            break
          case 'case3':
            if (r.masterMode === 'pick') masterId = r.pendingMasterId || null
            else masterIsNew = true
            break
          case 'case1':
            masterIsNew = true
            break
        }

        return {
          productId: (r.inventoryCase === 'matched' || r.inventoryCase === 'case3') ? r.productId : null,
          productIsNew: r.inventoryCase === 'case1' || r.inventoryCase === 'case2',
          newBrandName: r.newBrandName || r.rawName,
          newSpec: r.newSpec || r.rawSpec || '',
          newManufacturer: r.newManufacturer || r.rawManufacturer || '',
          masterId,
          masterIsNew,
          newMasterName: r.newMasterName,
          newMasterBaseUnit: r.newMasterBaseUnit,
          newMasterCategory: r.newMasterCategory,
          newMasterAliases: r.newMasterAliases.split(';').map((s) => s.trim()).filter(Boolean),
          newMasterLoc: r.newMasterLoc.split(';').map((s) => s.trim()).filter(Boolean),
          quantity: Number(r.quantity),
          unit: r.unit,
          unitPrice: r.unitPrice,
          expiryDate: r.expiryDate,
          lotNumber: r.lotNumber,
        }
      })

      const { saved, skipped } = await saveInventoryUploadItems(hosId, saveRows, selectedVendorId || undefined)
      toast.success(`${saved}개 품목 입고 완료${skipped ? ` (${skipped}개 건너뜀)` : ''}`)
      onOpenChange(false)
      reset()
      router.refresh()
    } catch (e) {
      toast.error('저장에 실패했습니다.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">거래명세서 업로드 입고</SheetTitle>
          {step === 'review' ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedVendorId && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                  {vendors.find((v) => v.id === selectedVendorId)?.name}
                </span>
              )}
              <p className="text-xs text-slate-400">
                총 {rows.length}개 · 입고 대상 {activeRows.length}개 · 준비 완료 {readyRows.length}개
              </p>
            </div>
          ) : step === 'idle' && selectedVendorId ? (
            <p className="text-xs text-teal-600">
              {vendors.find((v) => v.id === selectedVendorId)?.name}
            </p>
          ) : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'idle' && (
            <div className="flex flex-col gap-4 p-6">
              <p className="text-xs text-slate-500">
                거래명세서 이미지 또는 엑셀을 업로드하면 AI가 분석하여 재고 입고를 도와드립니다.
              </p>

              {vendors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-600">업체 선택 (선택사항)</p>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value="">업체 미지정</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  {selectedVendorId && (
                    <p className="text-[11px] text-teal-600">
                      ✓ 해당 업체 연결 제품만 우선 매칭에 사용됩니다
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 transition hover:border-teal-400 hover:text-teal-500"
              >
                <Camera size={28} strokeWidth={1.2} />
                <span className="text-sm font-medium">사진 업로드</span>
                <span className="text-[11px]">JPG, PNG, WEBP · 여러 장 선택 가능</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImages(e.target.files)}
              />

              <button
                type="button"
                onClick={() => excelRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-slate-400 transition hover:border-indigo-400 hover:text-indigo-500"
              >
                <FileSpreadsheet size={24} strokeWidth={1.2} />
                <span className="text-sm font-medium">엑셀 업로드</span>
                <span className="text-[11px]">XLSX, CSV · 헤더 행 필요 (제품명, 수량, 단가 등)</span>
              </button>
              <input
                ref={excelRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleExcel(e.target.files[0])}
              />
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={24} className="animate-spin text-teal-500" />
              <p className="text-sm">{analyzeMsg}</p>
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col divide-y">
              {rows.map((row) => (
                <ReviewRowCard
                  key={row._id}
                  row={row}
                  inventoryItems={inventoryItems}
                  onUpdate={(patch) => update(row._id, patch)}
                />
              ))}
            </div>
          )}
        </div>

        {step === 'review' && (
          <div className="shrink-0 space-y-2 border-t px-4 pb-2 pt-3">
            {notReadyRows.length > 0 && (
              <p className="text-center text-[11px] text-amber-500">
                ⚠ {notReadyRows.length}개 품목은 정보 미입력으로 건너뜁니다
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { reset(); setStep('idle') }}
                className="flex-1 text-xs"
              >
                다시 업로드
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || readyRows.length === 0}
                className="flex-1 bg-teal-600 text-xs hover:bg-teal-700 disabled:opacity-40"
              >
                {saving
                  ? <Loader2 size={13} className="mr-1 animate-spin" />
                  : <Save size={13} className="mr-1" />}
                {saving ? '저장 중...' : `${readyRows.length}개 입고`}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

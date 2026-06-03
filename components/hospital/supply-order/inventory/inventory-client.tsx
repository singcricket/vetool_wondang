'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, AlertTriangle, CheckCircle2, Circle, ClipboardList, ShoppingCart, PackagePlus, X, CalendarClock, Boxes, Camera } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { ITEM_CATEGORIES } from '@/types/hospital/supply-order-type'
import type { InventoryItem } from '@/types/hospital/supply-order-type'
import { bulkStockIn, type StockInRow } from '@/lib/actions/supply-order/inventory-actions'
import InventoryUseSheet from './inventory-use-sheet'
import InventoryDetailDialog from './inventory-detail-dialog'
import InventoryOrderDialog, { type OrderDraftItem } from './inventory-order-dialog'
import InventoryUploadSheet from './inventory-upload-sheet'

type Mode = 'order' | 'stock_in'

interface ItemProduct {
  id: string
  item_master_id: string | null
  brand_name: string
  specification: string | null
  manufacturer: string | null
  package_type: string
  units_per_package: number
  reference_price: number | null
  category: string[]
  tag: string[]
  item_master?: { id: string; generic_name: string; base_unit: string; category: string[] } | null
}

// 전체 제품 검색 combobox (연결된 제품이 없을 때)
function ProductSearchCombobox({
  allProducts,
  value,
  onChange,
}: {
  allProducts: ItemProduct[]
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = allProducts.find((p) => p.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allProducts.slice(0, 30)
    return allProducts.filter((p) =>
      p.brand_name.toLowerCase().includes(q) ||
      (p.manufacturer ?? '').toLowerCase().includes(q) ||
      (p.specification ?? '').toLowerCase().includes(q)
    ).slice(0, 30)
  }, [allProducts, query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={selected && !open ? selected.brand_name : query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => { setOpen(true); if (selected) setQuery('') }}
            placeholder="전체 제품 검색..."
            className="h-7 w-full rounded-md border border-slate-200 bg-white pl-6 pr-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setQuery(''); setOpen(false) }}
            className="shrink-0 text-slate-300 hover:text-slate-500"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-8 z-50 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[11px] text-slate-400">검색 결과 없음</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(p.id); setQuery(''); setOpen(false) }}
                className={cn(
                  'flex w-full flex-col px-3 py-2 text-left text-[11px] hover:bg-indigo-50',
                  value === p.id && 'bg-indigo-50',
                )}
              >
                <span className="font-medium text-slate-800">{p.brand_name}</span>
                {(p.specification || p.manufacturer) && (
                  <span className="text-slate-400">
                    {[p.manufacturer, p.specification].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  hosId: string
  items: InventoryItem[]
  vendors: { id: string; name: string }[]
  itemProducts: ItemProduct[]
}

export default function InventoryClient({ hosId, items, vendors, itemProducts }: Props) {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLocs, setSelectedLocs] = useState<string[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'empty'>('all')
  const [expiryFilter, setExpiryFilter] = useState<'expired' | 1 | 2 | 3 | 6 | null>(null)
  const [mode, setMode] = useState<Mode>('order')

  // 사용 기록 sheet
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 상세 dialog
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 체크박스 + 수량
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [qtys, setQtys] = useState<Record<string, string>>({})
  // 입고 모드: item_product_id 선택 + 유통기한
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, string>>({})
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({})

  // 주문 dialog
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderDraftItems, setOrderDraftItems] = useState<OrderDraftItem[]>([])

  // 연결 제품 팝업
  const [productPopupItem, setProductPopupItem] = useState<InventoryItem | null>(null)

  // 거래명세서 업로드 입고
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)

  const [isPending, startTransition] = useTransition()

  // item_master_id → 연결된 제품 목록
  const productsByMaster = useMemo(() => {
    const map = new Map<string, ItemProduct[]>()
    itemProducts.forEach((p) => {
      if (!p.item_master_id) return
      const arr = map.get(p.item_master_id) ?? []
      arr.push(p)
      map.set(p.item_master_id, arr)
    })
    return map
  }, [itemProducts])

  // 태그: item_master.loc + item_products.tag 통합
  const allLocs = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      item.loc.forEach((l) => set.add(l))
      productsByMaster.get(item.item_master_id)?.forEach((p) => p.tag?.forEach((t) => set.add(t)))
    })
    return Array.from(set).sort()
  }, [items, productsByMaster])

  const activeVendors = useMemo(() => {
    const usedIds = new Set(items.map((i) => i.default_vendor_id).filter(Boolean))
    return vendors.filter((v) => usedIds.has(v.id))
  }, [items, vendors])

  const lowStockCount = useMemo(() => items.filter((i) => i.is_low_stock && i.current_stock > 0).length, [items])
  const emptyCount = useMemo(() => items.filter((i) => i.current_stock === 0).length, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const today = new Date(); today.setHours(0, 0, 0, 0)

    return items.filter((item) => {
      if (q && !item.generic_name.toLowerCase().includes(q)) return false

      // 카테고리: item_master.category OR 연결된 제품의 category
      if (selectedCategories.length > 0) {
        const masterMatch = item.category.some((c) => selectedCategories.includes(c))
        const productMatch = productsByMaster.get(item.item_master_id)?.some(
          (p) => p.category?.some((c) => selectedCategories.includes(c))
        ) ?? false
        if (!masterMatch && !productMatch) return false
      }

      // 태그: item_master.loc OR 연결된 제품의 tag
      if (selectedLocs.length > 0) {
        const masterMatch = item.loc.some((l) => selectedLocs.includes(l))
        const productMatch = productsByMaster.get(item.item_master_id)?.some(
          (p) => p.tag?.some((t) => selectedLocs.includes(t))
        ) ?? false
        if (!masterMatch && !productMatch) return false
      }

      if (selectedVendors.length > 0 && (!item.default_vendor_id || !selectedVendors.includes(item.default_vendor_id))) return false

      // 재고 필터
      if (stockFilter === 'low' && !(item.is_low_stock && item.current_stock > 0)) return false
      if (stockFilter === 'empty' && item.current_stock !== 0) return false

      // 유통기한 필터
      if (expiryFilter !== null) {
        if (!item.earliest_expiry_date) return false
        const exp = new Date(item.earliest_expiry_date); exp.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((exp.getTime() - today.getTime()) / 86400000)
        if (expiryFilter === 'expired') { if (diffDays >= 0) return false }
        else { if (diffDays < 0 || diffDays > expiryFilter * 30) return false }
      }

      return true
    })
  }, [items, query, selectedCategories, selectedLocs, selectedVendors, stockFilter, expiryFilter, productsByMaster])

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setQtys((q) => { const n = { ...q }; delete n[id]; return n })
        setSelectedProductIds((p) => { const n = { ...p }; delete n[id]; return n })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearAll = () => {
    setCheckedIds(new Set())
    setQtys({})
    setSelectedProductIds({})
    setExpiryDates({})
  }

  const switchMode = (next: Mode) => {
    clearAll()
    setMode(next)
  }

  // 주문 검토
  const openOrderReview = () => {
    const draft: OrderDraftItem[] = []
    for (const id of checkedIds) {
      const item = items.find((i) => i.item_master_id === id)
      if (!item) continue
      const qty = Number(qtys[id])
      if (!qty || qty <= 0) continue
      draft.push({
        item_master_id: id,
        generic_name: item.generic_name,
        base_unit: item.base_unit,
        quantity: qty,
        default_vendor_id: item.default_vendor_id,
      })
    }
    if (draft.length === 0) {
      alert('선택한 품목의 주문 수량을 모두 입력해주세요.')
      return
    }
    setOrderDraftItems(draft)
    setOrderDialogOpen(true)
  }

  // 입고 저장
  const handleStockIn = () => {
    const rows: StockInRow[] = []
    for (const id of checkedIds) {
      const item = items.find((i) => i.item_master_id === id)
      if (!item) continue
      const qty = Number(qtys[id])
      if (!qty || qty <= 0) continue
      rows.push({
        item_master_id: id,
        item_product_id: selectedProductIds[id] || null,
        quantity: qty,
        base_unit: item.base_unit,
        expiry_date: expiryDates[id] || null,
      })
    }
    if (rows.length === 0) {
      alert('선택한 품목의 입고 수량을 모두 입력해주세요.')
      return
    }
    startTransition(async () => {
      try {
        await bulkStockIn(hosId, rows)
        toast.success(`${rows.length}개 품목 입고가 완료되었습니다.`)
        clearAll()
      } catch {
        toast.error('입고 저장에 실패했습니다.')
      }
    })
  }

  return (
    <>
    <div className="flex flex-col gap-4 p-4 pb-24">

      {/* 재고 필터 버튼 */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { key: 'all', label: '전체 품목', count: items.length, activeClass: 'border-slate-400 bg-slate-700 text-white', inactiveClass: 'border-slate-200 bg-white text-slate-700' },
            { key: 'low', label: '재고 부족', count: lowStockCount, activeClass: 'border-orange-400 bg-orange-500 text-white', inactiveClass: 'border-orange-200 bg-orange-50 text-orange-600' },
            { key: 'empty', label: '재고 없음', count: emptyCount, activeClass: 'border-slate-400 bg-slate-500 text-white', inactiveClass: 'border-slate-200 bg-slate-50 text-slate-500' },
          ] as const
        ).map(({ key, label, count, activeClass, inactiveClass }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStockFilter(key)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-center transition-all',
              stockFilter === key ? activeClass : inactiveClass,
            )}
          >
            <p className="text-lg font-bold leading-none">{count}</p>
            <p className="mt-0.5 text-[10px]">{label}</p>
          </button>
        ))}
      </div>

      {/* 유통기한 필터 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={12} className="text-slate-400" />
          <p className="text-[10px] font-semibold text-slate-400">유통기한 필터</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'expired', label: '기한 초과', activeClass: 'border-red-400 bg-red-500 text-white', inactiveClass: 'border-red-200 text-red-500 hover:border-red-300' },
              { key: 1, label: '1개월 이내', activeClass: 'border-amber-400 bg-amber-500 text-white', inactiveClass: 'border-amber-200 text-amber-600 hover:border-amber-300' },
              { key: 2, label: '2개월 이내', activeClass: 'border-amber-400 bg-amber-500 text-white', inactiveClass: 'border-amber-200 text-amber-600 hover:border-amber-300' },
              { key: 3, label: '3개월 이내', activeClass: 'border-amber-400 bg-amber-500 text-white', inactiveClass: 'border-amber-200 text-amber-600 hover:border-amber-300' },
              { key: 6, label: '6개월 이내', activeClass: 'border-amber-400 bg-amber-500 text-white', inactiveClass: 'border-amber-200 text-amber-600 hover:border-amber-300' },
            ] as const
          ).map(({ key, label, activeClass, inactiveClass }) => (
            <button
              key={String(key)}
              type="button"
              onClick={() => setExpiryFilter(expiryFilter === key ? null : key)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                expiryFilter === key ? activeClass : inactiveClass,
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 모드 토글 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode('order')}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all',
            mode === 'order'
              ? 'border-teal-500 bg-teal-500 text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-500',
          )}
        >
          <ShoppingCart size={20} />
          <span className="text-xs font-semibold">주문 모드</span>
        </button>
        <button
          type="button"
          onClick={() => switchMode('stock_in')}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all',
            mode === 'stock_in'
              ? 'border-indigo-500 bg-indigo-500 text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-500',
          )}
        >
          <PackagePlus size={20} />
          <span className="text-xs font-semibold">입고 모드</span>
        </button>
      </div>

      {/* 현재 모드 안내 배너 */}
      <div className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
        mode === 'order'
          ? 'bg-teal-50 text-teal-700'
          : 'bg-indigo-50 text-indigo-700',
      )}>
        {mode === 'order' ? (
          <><ShoppingCart size={13} className="shrink-0" /> 품목을 선택해 주문 수량을 입력하면 주문서를 만들 수 있습니다.</>
        ) : (
          <>
            <PackagePlus size={13} className="shrink-0" />
            <span className="flex-1">품목을 선택해 입고 수량을 입력하면 즉시 재고에 반영됩니다.</span>
            <button
              type="button"
              onClick={() => setUploadSheetOpen(true)}
              className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700"
            >
              <Camera size={11} /> 명세서 업로드
            </button>
          </>
        )}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="품목명 검색"
          className="pl-8 text-sm"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-400">카테고리</p>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategories((prev) =>
                prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
              )}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                selectedCategories.includes(cat)
                  ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 태그 필터 */}
      {allLocs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400">태그</p>
          <div className="flex flex-wrap gap-1.5">
            {allLocs.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocs((prev) =>
                  prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
                )}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                  selectedLocs.includes(loc)
                    ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                )}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 업체 필터 */}
      {activeVendors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400">업체</p>
          <div className="flex flex-wrap gap-1.5">
            {activeVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => setSelectedVendors((prev) =>
                  prev.includes(vendor.id) ? prev.filter((v) => v !== vendor.id) : [...prev, vendor.id]
                )}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                  selectedVendors.includes(vendor.id)
                    ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                )}
              >
                {vendor.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 결과 수 */}
      <p className="text-[11px] text-slate-400">
        {filtered.length}개 품목
        {(selectedCategories.length > 0 || selectedLocs.length > 0 || selectedVendors.length > 0 || query) && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSelectedCategories([]); setSelectedLocs([]); setSelectedVendors([]) }}
            className="ml-2 text-teal-600 underline"
          >
            필터 초기화
          </button>
        )}
      </p>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b px-2 py-2 w-8"></th>
              <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">품목명</th>
              <th className="border-b px-3 py-2 text-right font-semibold text-slate-500 whitespace-nowrap">재고</th>
              <th className="border-b px-2 py-2 text-center font-semibold text-slate-500 w-8"></th>
              <th className="border-b px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  해당하는 품목이 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const isChecked = checkedIds.has(item.item_master_id)
                // 이 item_master에 연결된 제품 목록
                const linkedProducts = itemProducts.filter(
                  (p) => p.item_master_id === item.item_master_id,
                )

                return (
                  <tr
                    key={item.item_master_id}
                    className={cn(
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                      !isChecked && 'cursor-pointer hover:bg-teal-50/40',
                      isChecked && mode === 'order' && 'bg-teal-50/30',
                      isChecked && mode === 'stock_in' && 'bg-indigo-50/30',
                    )}
                    onClick={() => {
                      if (!isChecked) { setSelectedItem(item); setSheetOpen(true) }
                    }}
                  >
                    {/* 체크박스 */}
                    <td className="border-b px-2 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(item.item_master_id)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'h-3.5 w-3.5 cursor-pointer',
                          mode === 'order' ? 'accent-teal-600' : 'accent-indigo-600',
                        )}
                      />
                    </td>

                    {/* 품목명 + 수량 입력 */}
                    <td className="border-b px-3 py-2.5">
                      <div className="font-medium text-slate-800">{item.generic_name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {item.category.map((c) => (
                          <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{c}</span>
                        ))}
                        {item.loc.map((l) => (
                          <span key={l} className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-600">{l}</span>
                        ))}
                        {/* 연결 제품 배지 */}
                        {(() => {
                          const linked = productsByMaster.get(item.item_master_id) ?? []
                          return linked.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setProductPopupItem(item) }}
                              className="flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                              <Boxes size={9} />
                              제품 {linked.length}개
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">제품 없음</span>
                          )
                        })()}
                      </div>

                      {/* 주문 모드 입력 */}
                      {isChecked && mode === 'order' && (
                        <div
                          className="mt-2 flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={qtys[item.item_master_id] ?? ''}
                            onChange={(e) => setQtys((prev) => ({ ...prev, [item.item_master_id]: e.target.value }))}
                            placeholder="주문수량"
                            className="h-7 w-24 text-right text-xs"
                            autoFocus
                          />
                          <span className="text-[11px] text-slate-400">{item.base_unit}</span>
                        </div>
                      )}

                      {/* 입고 모드 입력 */}
                      {isChecked && mode === 'stock_in' && (
                        <div
                          className="mt-2 flex flex-col gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {linkedProducts.length > 0 ? (
                            // 연결된 제품 있음 → select
                            <select
                              value={selectedProductIds[item.item_master_id] ?? ''}
                              onChange={(e) => setSelectedProductIds((prev) => ({
                                ...prev,
                                [item.item_master_id]: e.target.value,
                              }))}
                              className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                            >
                              <option value="">제품 미지정 (선택사항)</option>
                              {linkedProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.brand_name}{p.specification ? ` (${p.specification})` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            // 연결된 제품 없음 → 전체 검색 combobox
                            <ProductSearchCombobox
                              allProducts={itemProducts}
                              value={selectedProductIds[item.item_master_id] ?? ''}
                              onChange={(id) => setSelectedProductIds((prev) => ({
                                ...prev,
                                [item.item_master_id]: id,
                              }))}
                            />
                          )}
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={qtys[item.item_master_id] ?? ''}
                              onChange={(e) => setQtys((prev) => ({ ...prev, [item.item_master_id]: e.target.value }))}
                              placeholder="입고수량"
                              className="h-7 w-24 text-right text-xs border-indigo-200 focus:border-indigo-400"
                              autoFocus
                            />
                            <span className="text-[11px] text-slate-400">{item.base_unit}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarClock size={11} className="shrink-0 text-slate-400" />
                            <Input
                              type="date"
                              value={expiryDates[item.item_master_id] ?? ''}
                              onChange={(e) => setExpiryDates((prev) => ({ ...prev, [item.item_master_id]: e.target.value }))}
                              className="h-7 flex-1 text-xs border-indigo-200 focus:border-indigo-400"
                            />
                            <span className="text-[11px] text-slate-400">유통기한 (선택)</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 재고 + 유통기한 배지 */}
                    <td className="border-b px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={cn(
                        'font-semibold',
                        item.current_stock === 0
                          ? 'text-slate-300'
                          : item.is_low_stock
                            ? 'text-orange-600'
                            : 'text-slate-800',
                      )}>
                        {item.current_stock}
                      </span>
                      <span className="ml-1 text-slate-400">{item.base_unit}</span>
                      {item.earliest_expiry_date && (() => {
                        const today = new Date(); today.setHours(0, 0, 0, 0)
                        const exp = new Date(item.earliest_expiry_date); exp.setHours(0, 0, 0, 0)
                        const diffDays = Math.floor((exp.getTime() - today.getTime()) / 86400000)
                        if (diffDays < 0) return (
                          <span className="mt-0.5 block text-[10px] font-medium text-red-500">기한초과</span>
                        )
                        if (diffDays <= 30) return (
                          <span className="mt-0.5 block text-[10px] font-medium text-red-400">{diffDays}일 남음</span>
                        )
                        if (diffDays <= 180) return (
                          <span className="mt-0.5 block text-[10px] font-medium text-amber-500">{Math.ceil(diffDays / 30)}개월 남음</span>
                        )
                        return null
                      })()}
                    </td>

                    {/* 상태 아이콘 */}
                    <td className="border-b px-2 py-2.5 text-center">
                      {item.current_stock === 0 ? (
                        <Circle size={14} className="mx-auto text-slate-200" />
                      ) : item.is_low_stock ? (
                        <AlertTriangle size={14} className="mx-auto text-orange-400" />
                      ) : (
                        <CheckCircle2 size={14} className="mx-auto text-emerald-400" />
                      )}
                    </td>

                    {/* 상세 버튼 */}
                    <td className="border-b px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDetailItem(item); setDetailOpen(true) }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <ClipboardList size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Floating bar */}
    {checkedIds.size > 0 && (
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4">
        <div className={cn(
          'flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border px-4 py-2.5 shadow-lg bg-white',
          mode === 'order' ? 'border-teal-200' : 'border-indigo-200',
        )}>
          <span className={cn(
            'text-sm font-medium',
            mode === 'order' ? 'text-teal-700' : 'text-indigo-700',
          )}>
            {checkedIds.size}개 선택됨
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearAll} className="h-8 text-xs">
              취소
            </Button>
            {mode === 'order' ? (
              <Button
                size="sm"
                onClick={openOrderReview}
                className="h-8 gap-1 bg-teal-600 text-xs hover:bg-teal-700"
              >
                <ShoppingCart size={13} />
                주문 검토
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleStockIn}
                disabled={isPending}
                className="h-8 gap-1 bg-indigo-600 text-xs hover:bg-indigo-700"
              >
                <PackagePlus size={13} />
                {isPending ? '저장 중...' : '입고 저장'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )}

    <InventoryUseSheet
      hosId={hosId}
      item={selectedItem}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
    />

    <InventoryDetailDialog
      hosId={hosId}
      item={detailItem}
      open={detailOpen}
      onOpenChange={setDetailOpen}
    />

    <InventoryOrderDialog
      hosId={hosId}
      items={orderDraftItems}
      vendors={vendors}
      open={orderDialogOpen}
      onOpenChange={setOrderDialogOpen}
      onSuccess={clearAll}
    />

    {/* 연결 제품 팝업 */}
    <Dialog open={!!productPopupItem} onOpenChange={(v) => { if (!v) setProductPopupItem(null) }}>
      <DialogContent className="w-full max-w-sm p-0 gap-0">
        <DialogHeader className="border-b px-5 py-3.5">
          <DialogTitle className="text-sm">
            {productPopupItem?.generic_name}
            <span className="ml-2 font-normal text-slate-400 text-xs">연결된 제품</span>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          {productPopupItem && (() => {
            const linked = productsByMaster.get(productPopupItem.item_master_id) ?? []
            return linked.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-slate-400">연결된 제품이 없습니다.</p>
            ) : (
              <ul className="divide-y">
                {linked.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">{p.brand_name}</span>
                        {!p.item_master_id && (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-600">연결 필요</span>
                        )}
                      </div>
                      {(p.manufacturer || p.specification) && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {[p.manufacturer, p.specification].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {p.category && p.category.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.category.map((c) => (
                            <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{c}</span>
                          ))}
                          {p.tag?.map((t) => (
                            <span key={t} className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-600">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">
                        {p.units_per_package > 1
                          ? `${p.package_type} × ${p.units_per_package}${productPopupItem.base_unit}`
                          : p.package_type}
                      </p>
                      {p.reference_price != null && (
                        <p className="text-[11px] text-slate-400">{p.reference_price.toLocaleString()}원</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          })()}
        </div>
      </DialogContent>
    </Dialog>

    <InventoryUploadSheet
      hosId={hosId}
      itemProducts={itemProducts as any}
      inventoryItems={items}
      vendors={vendors}
      open={uploadSheetOpen}
      onOpenChange={setUploadSheetOpen}
    />
    </>
  )
}

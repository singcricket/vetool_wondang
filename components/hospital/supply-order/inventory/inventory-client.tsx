'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, AlertTriangle, CheckCircle2, Circle, ClipboardList, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { ITEM_CATEGORIES } from '@/types/hospital/supply-order-type'
import type { InventoryItem } from '@/types/hospital/supply-order-type'
import InventoryUseSheet from './inventory-use-sheet'
import InventoryDetailDialog from './inventory-detail-dialog'
import InventoryOrderDialog, { type OrderDraftItem } from './inventory-order-dialog'

interface Props {
  hosId: string
  items: InventoryItem[]
  vendors: { id: string; name: string }[]
}

export default function InventoryClient({ hosId, items, vendors }: Props) {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLocs, setSelectedLocs] = useState<string[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  // 사용 기록 sheet
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 상세 dialog
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 주문 체크박스 + 수량
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [orderQtys, setOrderQtys] = useState<Record<string, string>>({})
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderDraftItems, setOrderDraftItems] = useState<OrderDraftItem[]>([])

  const allLocs = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => item.loc.forEach((l) => set.add(l)))
    return Array.from(set).sort()
  }, [items])

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )

  const toggleLoc = (loc: string) =>
    setSelectedLocs((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    )

  const toggleVendor = (id: string) =>
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )

  // items에 실제 연결된 업체만 필터 칩으로 표시
  const activeVendors = useMemo(() => {
    const usedIds = new Set(items.map((i) => i.default_vendor_id).filter(Boolean))
    return vendors.filter((v) => usedIds.has(v.id))
  }, [items, vendors])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (q && !item.generic_name.toLowerCase().includes(q)) return false
      if (selectedCategories.length > 0) {
        if (!item.category.some((c) => selectedCategories.includes(c))) return false
      }
      if (selectedLocs.length > 0) {
        if (!item.loc.some((l) => selectedLocs.includes(l))) return false
      }
      if (selectedVendors.length > 0) {
        if (!item.default_vendor_id || !selectedVendors.includes(item.default_vendor_id)) return false
      }
      return true
    })
  }, [items, query, selectedCategories, selectedLocs, selectedVendors])

  const lowStockCount = items.filter((i) => i.is_low_stock && i.current_stock > 0).length
  const emptyCount = items.filter((i) => i.current_stock === 0).length

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setOrderQtys((q) => { const n = { ...q }; delete n[id]; return n })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearOrder = () => {
    setCheckedIds(new Set())
    setOrderQtys({})
  }

  const openOrderReview = () => {
    const draft: OrderDraftItem[] = []
    for (const id of checkedIds) {
      const item = items.find((i) => i.item_master_id === id)
      if (!item) continue
      const qty = Number(orderQtys[id])
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
      // 수량 미입력 항목이 있으면 경고
      const missingQty = Array.from(checkedIds).filter((id) => {
        const q = Number(orderQtys[id])
        return !q || q <= 0
      })
      if (missingQty.length > 0) {
        alert('선택한 품목의 주문 수량을 모두 입력해주세요.')
        return
      }
      return
    }
    setOrderDraftItems(draft)
    setOrderDialogOpen(true)
  }

  return (
    <>
    <div className="flex flex-col gap-4 p-4 pb-24">

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-white px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-slate-800">{items.length}</p>
          <p className="text-[10px] text-slate-400">전체 품목</p>
        </div>
        <div className="rounded-lg border bg-orange-50 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-orange-600">{lowStockCount}</p>
          <p className="text-[10px] text-orange-400">재고 부족</p>
        </div>
        <div className="rounded-lg border bg-slate-50 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-slate-500">{emptyCount}</p>
          <p className="text-[10px] text-slate-400">재고 없음</p>
        </div>
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
          {ITEM_CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                  active
                    ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* 태그 필터 */}
      {allLocs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400">태그</p>
          <div className="flex flex-wrap gap-1.5">
            {allLocs.map((loc) => {
              const active = selectedLocs.includes(loc)
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLoc(loc)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                    active
                      ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {loc}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 업체 필터 */}
      {activeVendors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400">업체</p>
          <div className="flex flex-wrap gap-1.5">
            {activeVendors.map((vendor) => {
              const active = selectedVendors.includes(vendor.id)
              return (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => toggleVendor(vendor.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                    active
                      ? 'border-teal-400 bg-teal-50 font-medium text-teal-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {vendor.name}
                </button>
              )
            })}
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
                return (
                  <tr
                    key={item.item_master_id}
                    className={cn(
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                      !isChecked && 'cursor-pointer hover:bg-teal-50/40',
                      isChecked && 'bg-teal-50/30',
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
                        className="h-3.5 w-3.5 cursor-pointer accent-teal-600"
                      />
                    </td>

                    {/* 품목명 + 주문수량 입력 */}
                    <td className="border-b px-3 py-2.5">
                      <div className="font-medium text-slate-800">{item.generic_name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {item.category.map((c) => (
                          <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{c}</span>
                        ))}
                        {item.loc.map((l) => (
                          <span key={l} className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-600">{l}</span>
                        ))}
                      </div>
                      {isChecked && (
                        <div
                          className="mt-2 flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={orderQtys[item.item_master_id] ?? ''}
                            onChange={(e) =>
                              setOrderQtys((prev) => ({ ...prev, [item.item_master_id]: e.target.value }))
                            }
                            placeholder="주문수량"
                            className="h-7 w-24 text-right text-xs"
                            autoFocus
                          />
                          <span className="text-[11px] text-slate-400">{item.base_unit}</span>
                        </div>
                      )}
                    </td>

                    {/* 재고 */}
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

    {/* 주문 floating bar */}
    {checkedIds.size > 0 && (
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4">
        <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-teal-200 bg-white px-4 py-2.5 shadow-lg">
          <span className="text-sm font-medium text-teal-700">
            {checkedIds.size}개 선택됨
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearOrder} className="h-8 text-xs">
              취소
            </Button>
            <Button
              size="sm"
              onClick={openOrderReview}
              className="h-8 gap-1 bg-teal-600 text-xs hover:bg-teal-700"
            >
              <ShoppingCart size={13} />
              주문 검토
            </Button>
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
      onSuccess={clearOrder}
    />
    </>
  )
}

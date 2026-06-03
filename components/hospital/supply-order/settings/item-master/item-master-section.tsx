'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Package, Search, AlertTriangle, Loader2, SlidersHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toggleItemMasterActive, bulkDeleteItemMasters } from '@/lib/actions/supply-order/item-master-actions'
import { toast } from 'sonner'
import ItemMasterFormSheet from './item-master-form-sheet'
import ItemMasterBulkUploadDialog from './item-master-bulk-upload-dialog'
import ItemMasterBulkEditSheet from './item-master-bulk-edit-sheet'
import type { ItemMaster, ItemProduct, Vendor } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  items: ItemMaster[]
  vendors: Pick<Vendor, 'id' | 'name'>[]
  itemProducts: ItemProduct[]
}

export default function ItemMasterSection({ hosId, items, vendors, itemProducts }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ItemMaster | undefined>(undefined)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.length}개 품목을 삭제하시겠습니까?\n\n연결된 주문 품목이 있으면 삭제되지 않을 수 있습니다.`)) return
    try {
      setBulkDeleting(true)
      await bulkDeleteItemMasters(hosId, selectedIds)
      toast.success(`${selectedIds.length}개 품목이 삭제되었습니다.`)
      setSelectedIds([])
    } catch {
      toast.error('삭제에 실패했습니다. 연결된 데이터가 있는지 확인하세요.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const openAdd = () => { setEditing(undefined); setSheetOpen(true) }
  const openEdit = (item: ItemMaster) => { setEditing(item); setSheetOpen(true) }

  const handleToggle = async (item: ItemMaster) => {
    try {
      setToggling(item.id)
      await toggleItemMasterActive(hosId, item.id, !item.is_active)
      toast.success(item.is_active ? '비활성화 되었습니다.' : '활성화 되었습니다.')
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setToggling(null)
    }
  }

  const filtered = items
    .filter((i) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        i.generic_name.toLowerCase().includes(q) ||
        i.category.some((c) => c.toLowerCase().includes(q)) ||
        i.ingredient.some((v) => v.toLowerCase().includes(q)) ||
        i.aliases.some((a) => a.toLowerCase().includes(q)) ||
        i.loc.some((l) => l.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => (a.category[0] ?? '').localeCompare(b.category[0] ?? '', 'ko') || a.generic_name.localeCompare(b.generic_name, 'ko'))

  const filteredIds = filtered.map((i) => i.id)
  const allChecked = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id))
  const someChecked = filteredIds.some((id) => selectedIds.includes(id))

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const activeCount = items.filter((i) => i.is_active).length

  const productCountMap = useMemo(() => {
    const map = new Map<string, number>()
    itemProducts.forEach((p) => {
      if (p.item_master_id) map.set(p.item_master_id, (map.get(p.item_master_id) ?? 0) + 1)
    })
    return map
  }, [itemProducts])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          품목 마스터
          <span className="ml-1 text-xs font-normal text-slate-400">{activeCount}개 활성</span>
        </p>
        <div className="flex gap-2">
          <ItemMasterBulkUploadDialog hosId={hosId} />
          <Button size="sm" onClick={openAdd} className="gap-1 bg-teal-600 hover:bg-teal-700">
            <Plus size={14} />
            품목 추가
          </Button>
        </div>
      </div>

      {/* 검색 */}
      {items.length > 4 && (
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="품목명, 카테고리, 성분, 별칭, 태그 검색"
            className="pl-7 text-xs"
          />
        </div>
      )}

      {/* 일괄 수정 액션 바 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
          <span className="text-xs font-medium text-teal-700">
            {selectedIds.length}개 선택됨
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              선택 해제
            </button>
            <Button
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="h-7 gap-1 bg-red-500 px-2.5 text-xs hover:bg-red-600"
            >
              {bulkDeleting
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />}
              삭제
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkEditOpen(true)}
              disabled={bulkDeleting}
              className="h-7 gap-1 bg-teal-600 px-2.5 text-xs hover:bg-teal-700"
            >
              <SlidersHorizontal size={12} />
              일괄 수정
            </Button>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-slate-400">
          <Package size={32} strokeWidth={1.2} />
          <p className="text-sm">등록된 품목이 없습니다.</p>
          <Button size="sm" variant="outline" onClick={openAdd}>첫 품목 등록</Button>
        </div>
      )}

      {/* 테이블 */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b px-3 py-2 text-center w-8">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 cursor-pointer accent-teal-600"
                  />
                </th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">품목명</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">성분</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">카테고리</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">태그</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">기준단위</th>
                <th className="border-b px-3 py-2 text-center font-semibold text-slate-500 whitespace-nowrap">최소재고</th>
                <th className="border-b px-3 py-2 text-center font-semibold text-slate-500 whitespace-nowrap">상태</th>
                <th className="border-b px-3 py-2 text-center font-semibold text-slate-500 whitespace-nowrap">편집</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const isChecked = selectedIds.includes(item.id)
                const productCount = productCountMap.get(item.id) ?? 0
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                      !item.is_active && 'opacity-50',
                      isChecked && 'bg-teal-50/60',
                    )}
                  >
                    {/* 체크박스 */}
                    <td className="border-b px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(item.id)}
                        className="h-3.5 w-3.5 cursor-pointer accent-teal-600"
                      />
                    </td>

                    {/* 품목명 */}
                    <td className="border-b px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">{item.generic_name}</span>
                        {item.alert_min_stock > 0 && (
                          <AlertTriangle size={11} className="shrink-0 text-amber-400" />
                        )}
                      </div>
                      {item.aliases.length > 0 && (
                        <p className="mt-0.5 truncate text-[10px] text-slate-400 max-w-[160px]">
                          {item.aliases.join(', ')}
                        </p>
                      )}
                      {productCount > 0 ? (
                        <span className="mt-0.5 text-[10px] text-teal-600">제품 {productCount}개 연결됨</span>
                      ) : (
                        <span className="mt-0.5 text-[10px] text-slate-300">제품 없음</span>
                      )}
                    </td>

                    {/* 성분 */}
                    <td className="border-b px-3 py-2">
                      {item.ingredient.length > 0
                        ? <span className="text-indigo-600">{item.ingredient.join(', ')}</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>

                    {/* 카테고리 */}
                    <td className="border-b px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {item.category.map((c) => (
                          <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{c}</span>
                        ))}
                      </div>
                    </td>

                    {/* 태그 */}
                    <td className="border-b px-3 py-2">
                      {item.loc && item.loc.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.loc.map((l) => (
                            <span key={l} className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-700">
                              {l}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* 기준단위 */}
                    <td className="border-b px-3 py-2 whitespace-nowrap text-slate-500">
                      {item.base_unit}
                    </td>

                    {/* 최소재고 */}
                    <td className="border-b px-3 py-2 text-center whitespace-nowrap text-slate-500">
                      {item.alert_min_stock > 0
                        ? `${item.alert_min_stock} ${item.base_unit}`
                        : <span className="text-slate-300">—</span>
                      }
                    </td>

                    {/* 상태 */}
                    <td className="border-b px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={toggling === item.id}
                        onClick={() => handleToggle(item)}
                        className={cn(
                          'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
                        )}
                      >
                        {toggling === item.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : item.is_active ? '활성' : '비활성'
                        }
                      </button>
                    </td>

                    {/* 편집 */}
                    <td className="border-b px-3 py-2 text-center">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(item)}>
                        <Pencil size={12} />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && search && (
            <p className="py-6 text-center text-xs text-slate-400">검색 결과가 없습니다.</p>
          )}
        </div>
      )}

      <ItemMasterFormSheet
        hosId={hosId}
        item={editing}
        vendors={vendors}
        itemProducts={itemProducts}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <ItemMasterBulkEditSheet
        hosId={hosId}
        selectedIds={selectedIds}
        vendors={vendors}
        open={bulkEditOpen}
        onOpenChange={(v) => {
          setBulkEditOpen(v)
          if (!v) setSelectedIds([])
        }}
      />
    </div>
  )
}

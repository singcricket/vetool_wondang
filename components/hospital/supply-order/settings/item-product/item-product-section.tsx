'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Boxes, Search, Link2Off, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toggleItemProductActive } from '@/lib/actions/supply-order/item-product-actions'
import { toast } from 'sonner'
import ItemProductFormSheet from './item-product-form-sheet'
import ItemProductBulkUploadDialog from './item-product-bulk-upload-dialog'
import type { ItemMaster, ItemProduct } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  products: ItemProduct[]
  itemMasters: ItemMaster[]
}

export default function ItemProductSection({ hosId, products, itemMasters }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ItemProduct | undefined>(undefined)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const openAdd = () => { setEditing(undefined); setSheetOpen(true) }
  const openEdit = (product: ItemProduct) => { setEditing(product); setSheetOpen(true) }

  const handleToggle = async (product: ItemProduct) => {
    try {
      setToggling(product.id)
      await toggleItemProductActive(hosId, product.id, !product.is_active)
      toast.success(product.is_active ? '비활성화 되었습니다.' : '활성화 되었습니다.')
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setToggling(null)
    }
  }

  const filtered = products
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.brand_name.toLowerCase().includes(q) ||
        (p.manufacturer ?? '').toLowerCase().includes(q) ||
        (p.specification ?? '').toLowerCase().includes(q) ||
        (p.item_master?.generic_name ?? '').toLowerCase().includes(q) ||
        (p.item_master?.category ?? []).some((c) => c.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      const aCat = a.item_master?.generic_name ?? 'zzz'
      const bCat = b.item_master?.generic_name ?? 'zzz'
      return aCat.localeCompare(bCat, 'ko') || a.brand_name.localeCompare(b.brand_name, 'ko')
    })

  const activeCount = products.filter((p) => p.is_active).length
  const unlinkedCount = products.filter((p) => !p.item_master_id).length

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          제품
          <span className="ml-1 text-xs font-normal text-slate-400">{activeCount}개 활성</span>
          {unlinkedCount > 0 && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              <Link2Off size={10} />
              {unlinkedCount}개 연결 필요
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <ItemProductBulkUploadDialog hosId={hosId} />
          <Button size="sm" onClick={openAdd} className="gap-1 bg-teal-600 hover:bg-teal-700">
            <Plus size={14} />
            제품 추가
          </Button>
        </div>
      </div>

      {/* 검색 */}
      {products.length > 4 && (
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명, 제조사, 규격, 품목명 검색"
            className="pl-7 text-xs"
          />
        </div>
      )}

      {/* 빈 상태 */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-slate-400">
          <Boxes size={32} strokeWidth={1.2} />
          <p className="text-sm">등록된 제품이 없습니다.</p>
          <p className="text-xs">품목 마스터에 연결된 실제 브랜드 제품을 등록하세요.</p>
          <Button size="sm" variant="outline" onClick={openAdd}>첫 제품 등록</Button>
        </div>
      )}

      {/* 테이블 */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">제품명</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">제조사</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">품목 마스터</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">성분</th>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">포장</th>
                <th className="border-b px-3 py-2 text-right font-semibold text-slate-500 whitespace-nowrap">참고단가</th>
                <th className="border-b px-3 py-2 text-center font-semibold text-slate-500 whitespace-nowrap">상태</th>
                <th className="border-b px-3 py-2 text-center font-semibold text-slate-500 whitespace-nowrap">편집</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, idx) => {
                const baseUnit = product.item_master?.base_unit ?? '개'
                return (
                  <tr
                    key={product.id}
                    className={cn(
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                      !product.is_active && 'opacity-50',
                    )}
                  >
                    {/* 제품명 */}
                    <td className="border-b px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">{product.brand_name}</span>
                        {!product.item_master_id && (
                          <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 whitespace-nowrap">
                            <Link2Off size={9} />
                            연결 필요
                          </span>
                        )}
                      </div>
                      {product.specification && (
                        <p className="mt-0.5 text-[10px] text-slate-400">{product.specification}</p>
                      )}
                    </td>

                    {/* 제조사 */}
                    <td className="border-b px-3 py-2 whitespace-nowrap text-slate-500">
                      {product.manufacturer ?? <span className="text-slate-300">—</span>}
                    </td>

                    {/* 품목 마스터 */}
                    <td className="border-b px-3 py-2">
                      {product.item_master ? (
                        <div>
                          <span className="font-medium text-slate-700">{product.item_master.generic_name}</span>
                          <span className="ml-1 text-[10px] text-slate-400">{product.item_master.category.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* 성분 */}
                    <td className="border-b px-3 py-2 text-indigo-600">
                      {product.ingredient
                        ? product.ingredient
                        : <span className="text-slate-300">—</span>
                      }
                    </td>

                    {/* 포장 */}
                    <td className="border-b px-3 py-2 whitespace-nowrap text-slate-500">
                      {product.units_per_package > 1
                        ? `${product.package_type} × ${product.units_per_package}${baseUnit}`
                        : product.package_type
                      }
                    </td>

                    {/* 참고단가 */}
                    <td className="border-b px-3 py-2 text-right whitespace-nowrap text-slate-500">
                      {product.reference_price != null
                        ? `${product.reference_price.toLocaleString()}원`
                        : <span className="text-slate-300">—</span>
                      }
                    </td>

                    {/* 상태 */}
                    <td className="border-b px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={toggling === product.id}
                        onClick={() => handleToggle(product)}
                        className={cn(
                          'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                          product.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
                        )}
                      >
                        {toggling === product.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : product.is_active ? '활성' : '비활성'
                        }
                      </button>
                    </td>

                    {/* 편집 */}
                    <td className="border-b px-3 py-2 text-center">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(product)}>
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

      <ItemProductFormSheet
        hosId={hosId}
        product={editing}
        itemMasters={itemMasters}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

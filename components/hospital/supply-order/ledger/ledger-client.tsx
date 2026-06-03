'use client'

import { useState, useMemo, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Search, Printer, Loader2, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { getLedgerProducts, getLedgerDetail } from '@/lib/actions/supply-order/ledger-actions'
import type { LedgerProduct, LedgerDetail } from '@/lib/actions/supply-order/ledger-actions'
import { ITEM_CATEGORIES } from '@/types/hospital/supply-order-type'
import LedgerPrintDialog from './ledger-print-dialog'

interface Props {
  hosId: string
  initialProducts: LedgerProduct[]
  initialFromDate: string
  initialToDate: string
}

export default function LedgerClient({ hosId, initialProducts, initialFromDate, initialToDate }: Props) {
  const [fromDate, setFromDate] = useState(initialFromDate)
  const [toDate, setToDate] = useState(initialToDate)
  const [products, setProducts] = useState<LedgerProduct[]>(initialProducts)
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  // 상세 팝업
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<LedgerDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleDateSearch = () => {
    startTransition(async () => {
      const result = await getLedgerProducts(hosId, fromDate, toDate)
      setProducts(result)
      setSelectedCategories([])
      setSelectedTags([])
    })
  }

  // 전체 카테고리/태그 수집
  const allCategories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.category.forEach((c) => set.add(c)))
    return Array.from(set).sort()
  }, [products])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.tag.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (q && !p.brand_name.toLowerCase().includes(q) &&
        !(p.manufacturer ?? '').toLowerCase().includes(q) &&
        !(p.generic_name ?? '').toLowerCase().includes(q)) return false
      if (selectedCategories.length > 0 &&
        !p.category.some((c) => selectedCategories.includes(c))) return false
      if (selectedTags.length > 0 &&
        !p.tag.some((t) => selectedTags.includes(t))) return false
      return true
    })
  }, [products, query, selectedCategories, selectedTags])

  const toggleCategory = (c: string) =>
    setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  const handleProductClick = async (product: LedgerProduct) => {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const d = await getLedgerDetail(hosId, product.item_product_id, fromDate, toDate)
      setDetail(d)
    } catch {
      setDetailOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* 조회 기간 */}
      <div className="border-b bg-slate-50 px-4 py-3">
        <p className="mb-2 text-xs font-medium text-slate-600">조회 기간</p>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 flex-1 text-xs"
          />
          <span className="text-xs text-slate-400">~</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 flex-1 text-xs"
          />
          <Button
            onClick={handleDateSearch}
            disabled={isPending}
            size="sm"
            className="h-8 shrink-0 bg-teal-600 px-3 text-xs hover:bg-teal-700"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : '조회'}
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="border-b px-4 py-3 space-y-2">
        {/* 검색 */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제품명, 제조사, 성분명 검색"
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* 카테고리 */}
        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                  selectedCategories.includes(c)
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* 태그 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                  selectedTags.includes(t)
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-indigo-300',
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 결과 카운트 */}
      <div className="px-4 py-2 text-[11px] text-slate-400">
        {fromDate} ~ {toDate} · {filtered.length}개 제품
      </div>

      {/* 제품 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
          <FileText size={28} strokeWidth={1.2} />
          <p className="text-sm">해당 기간에 입/출고 기록이 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y">
          {filtered.map((product) => (
            <li key={product.item_product_id}>
              <button
                type="button"
                onClick={() => handleProductClick(product)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
              >
                <FileText size={16} className="shrink-0 text-slate-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {product.brand_name}
                    {product.manufacturer && (
                      <span className="ml-1 font-normal text-slate-400">({product.manufacturer})</span>
                    )}
                  </p>
                  {product.specification && (
                    <p className="text-[11px] text-slate-400">{product.specification}</p>
                  )}
                  {product.generic_name && (
                    <p className="text-[11px] text-teal-600">{product.generic_name}</p>
                  )}
                  {(product.category.length > 0 || product.tag.length > 0) && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {product.category.map((c) => (
                        <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{c}</span>
                      ))}
                      {product.tag.map((t) => (
                        <span key={t} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] text-indigo-500">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {product.log_count}건
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 수불대장 팝업 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent aria-describedby={undefined} className="flex max-h-[95vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <VisuallyHidden><DialogTitle>인체용 의약품 출납대장</DialogTitle></VisuallyHidden>
          {loadingDetail || !detail ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={22} className="animate-spin text-teal-500" />
            </div>
          ) : (
            <LedgerPrintDialog
              detail={detail}
              fromDate={fromDate}
              toDate={toDate}
              onClose={() => setDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

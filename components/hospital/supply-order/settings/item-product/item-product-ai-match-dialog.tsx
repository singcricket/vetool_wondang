'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2, Sparkles, Link2, Search, CheckCircle2, XCircle,
  AlertTriangle, ChevronRight, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import {
  getUnlinkedProducts,
  matchProductBatch,
  bulkLinkProductsToMasters,
} from '@/lib/actions/supply-order/item-product-match-actions'
import type { ProductForMatch, MatchResult } from '@/lib/actions/supply-order/item-product-match-actions'
import type { ItemMaster } from '@/types/hospital/supply-order-type'

const BATCH_SIZE = 30

type Phase = 'select' | 'matching' | 'review'

type Decision = {
  master_id: string | null
  accepted: boolean
}

interface Props {
  hosId: string
  itemMasters: ItemMaster[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ConfidenceBadge({ value }: { value: number }) {
  const { label, cls } =
    value >= 90 ? { label: `${value}%`, cls: 'bg-emerald-100 text-emerald-700' }
    : value >= 70 ? { label: `${value}%`, cls: 'bg-teal-100 text-teal-700' }
    : value >= 50 ? { label: `${value}%`, cls: 'bg-amber-100 text-amber-700' }
    : { label: `${value}%`, cls: 'bg-red-100 text-red-600' }
  return <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', cls)}>{label}</span>
}

export default function ItemProductAiMatchDialog({ hosId, itemMasters, open, onOpenChange }: Props) {
  const [phase, setPhase] = useState<Phase>('select')
  const [products, setProducts] = useState<ProductForMatch[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<MatchResult[]>([])
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [linking, setLinking] = useState(false)

  // 미연결 제품 로드
  useEffect(() => {
    if (!open) return
    setPhase('select')
    setSelected(new Set())
    setResults([])
    setDecisions({})
    setSearch('')
    setLoadingProducts(true)
    getUnlinkedProducts(hosId)
      .then(setProducts)
      .catch(() => toast.error('제품 목록을 불러오지 못했습니다.'))
      .finally(() => setLoadingProducts(false))
  }, [open, hosId])

  const masterMap = useMemo(
    () => new Map(itemMasters.map((m) => [m.id, m])),
    [itemMasters]
  )

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.brand_name.toLowerCase().includes(q) ||
        (p.manufacturer ?? '').toLowerCase().includes(q) ||
        (p.ingredient ?? '').toLowerCase().includes(q) ||
        (p.specification ?? '').toLowerCase().includes(q)
    )
  }, [products, search])

  const toggleAll = () => {
    if (selected.size === filteredProducts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // AI 매칭 실행
  const runMatching = async () => {
    const ids = Array.from(selected)
    if (!ids.length) return

    const batches: string[][] = []
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      batches.push(ids.slice(i, i + BATCH_SIZE))
    }

    setPhase('matching')
    setProgress({ done: 0, total: batches.length })

    const allResults: MatchResult[] = []
    for (const batch of batches) {
      try {
        const batchResults = await matchProductBatch(hosId, batch)
        allResults.push(...batchResults)
      } catch {
        toast.error(`배치 처리 중 오류가 발생했습니다. 일부 결과가 누락될 수 있습니다.`)
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }))
    }

    // 기본 결정: confidence 70+ & master 있으면 자동 수락
    const dec: Record<string, Decision> = {}
    for (const r of allResults) {
      dec[r.product_id] = {
        master_id: r.master_id,
        accepted: r.confidence >= 70 && r.master_id !== null,
      }
    }
    setDecisions(dec)
    setResults(allResults)
    setPhase('review')
  }

  // 일괄 연결 저장
  const handleLink = async () => {
    const links = results
      .filter((r) => decisions[r.product_id]?.accepted && decisions[r.product_id]?.master_id)
      .map((r) => ({
        product_id: r.product_id,
        master_id: decisions[r.product_id].master_id!,
      }))

    if (!links.length) {
      toast.error('연결할 항목이 없습니다.')
      return
    }

    setLinking(true)
    try {
      await bulkLinkProductsToMasters(hosId, links)
      toast.success(`${links.length}개 제품이 품목 마스터에 연결되었습니다.`)
      onOpenChange(false)
    } catch {
      toast.error('연결 저장에 실패했습니다.')
    } finally {
      setLinking(false)
    }
  }

  // 검토 단계 통계
  const reviewStats = useMemo(() => {
    const accepted = results.filter((r) => decisions[r.product_id]?.accepted).length
    const lowConf = results.filter(
      (r) => !decisions[r.product_id]?.accepted && r.confidence > 0 && r.master_id
    ).length
    const noMatch = results.filter((r) => !r.master_id).length
    return { accepted, lowConf, noMatch }
  }, [results, decisions])

  // 검토 목록 정렬: 수락됨 → 낮은신뢰도 → 매칭없음
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const aAcc = decisions[a.product_id]?.accepted ? 0 : a.master_id ? 1 : 2
      const bAcc = decisions[b.product_id]?.accepted ? 0 : b.master_id ? 1 : 2
      if (aAcc !== bAcc) return aAcc - bAcc
      return b.confidence - a.confidence
    })
  }, [results, decisions])

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles size={16} className="text-indigo-500" />
            AI 품목 마스터 매칭
            {phase === 'select' && (
              <span className="text-sm font-normal text-slate-400">
                — 미연결 제품 {products.length}개
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ───────── 선택 단계 ───────── */}
        {phase === 'select' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {loadingProducts ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-slate-300" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
                <CheckCircle2 size={36} strokeWidth={1.2} className="text-emerald-300" />
                <p className="text-sm">모든 제품이 품목 마스터에 연결되어 있습니다.</p>
              </div>
            ) : (
              <>
                <div className="shrink-0 space-y-2 border-b px-5 py-3">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="제품명, 제조사, 성분, 규격 검색"
                      className="pl-7 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selected.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleAll}
                        className="h-3.5 w-3.5 accent-indigo-600"
                      />
                      전체 선택 ({filteredProducts.length}개)
                    </label>
                    <span className="text-indigo-600 font-medium">{selected.size}개 선택됨</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="border-b px-3 py-2 w-8"></th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">제품명</th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">제조사</th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">성분</th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">규격</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, idx) => (
                        <tr
                          key={p.id}
                          onClick={() => toggleOne(p.id)}
                          className={cn(
                            'cursor-pointer transition-colors',
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                            selected.has(p.id) && 'bg-indigo-50/50',
                          )}
                        >
                          <td className="border-b px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3.5 w-3.5 accent-indigo-600"
                            />
                          </td>
                          <td className="border-b px-3 py-2 font-medium text-slate-800">{p.brand_name}</td>
                          <td className="border-b px-3 py-2 text-slate-500">{p.manufacturer ?? '—'}</td>
                          <td className="border-b px-3 py-2 text-indigo-600">{p.ingredient ?? '—'}</td>
                          <td className="border-b px-3 py-2 text-slate-500">{p.specification ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="shrink-0 flex items-center justify-between border-t bg-white px-5 py-3">
                  <p className="text-xs text-slate-400">
                    30개씩 배치 처리됩니다 ({Math.ceil(selected.size / BATCH_SIZE)}개 배치 예상)
                  </p>
                  <Button
                    onClick={runMatching}
                    disabled={selected.size === 0}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
                  >
                    <Sparkles size={14} />
                    AI 매칭 시작 ({selected.size}개)
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ───────── 매칭 중 단계 ───────── */}
        {phase === 'matching' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16">
            <div className="relative">
              <Sparkles size={40} className="text-indigo-300" />
              <Loader2 size={18} className="absolute -right-1 -top-1 animate-spin text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">AI가 매칭을 분석하고 있습니다...</p>
              <p className="mt-1 text-xs text-slate-400">
                {progress.done} / {progress.total} 배치 완료
              </p>
            </div>
            {/* 프로그레스 바 */}
            <div className="w-64 overflow-hidden rounded-full bg-slate-100 h-2">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* ───────── 검토 단계 ───────── */}
        {phase === 'review' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* 통계 바 */}
            <div className="shrink-0 flex items-center gap-4 border-b bg-slate-50 px-5 py-2.5 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={13} />
                수락 {reviewStats.accepted}개
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle size={13} />
                검토 필요 {reviewStats.lowConf}개
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <XCircle size={13} />
                매칭 없음 {reviewStats.noMatch}개
              </span>
              <button
                type="button"
                onClick={() => setPhase('select')}
                className="ml-auto flex items-center gap-1 text-slate-400 hover:text-slate-600"
              >
                <RotateCcw size={12} />
                다시 선택
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">제품</th>
                    <th className="px-3 py-2 w-6"></th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">추천 품목 마스터</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">신뢰도</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">근거</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-500">연결</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r, idx) => {
                    const product = productMap.get(r.product_id)
                    const decision = decisions[r.product_id]
                    const master = decision?.master_id ? masterMap.get(decision.master_id) : null
                    const isAccepted = decision?.accepted ?? false
                    const hasMatch = !!r.master_id

                    return (
                      <tr
                        key={r.product_id}
                        className={cn(
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                          isAccepted && 'bg-emerald-50/30',
                          !hasMatch && 'opacity-60',
                        )}
                      >
                        {/* 제품 */}
                        <td className="border-b px-3 py-2">
                          <p className="font-medium text-slate-800">{product?.brand_name ?? '—'}</p>
                          {product?.specification && (
                            <p className="text-[10px] text-slate-400">{product.specification}</p>
                          )}
                          {product?.ingredient && (
                            <p className="text-[10px] text-indigo-500">{product.ingredient}</p>
                          )}
                        </td>

                        {/* 화살표 */}
                        <td className="border-b px-1 py-2 text-center">
                          <ChevronRight size={13} className="text-slate-300 mx-auto" />
                        </td>

                        {/* 추천 마스터 선택 */}
                        <td className="border-b px-3 py-2">
                          {hasMatch ? (
                            <select
                              value={decision?.master_id ?? ''}
                              onChange={(e) =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [r.product_id]: {
                                    master_id: e.target.value || null,
                                    accepted: !!e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-indigo-400 focus:outline-none"
                            >
                              <option value="">— 선택 안 함 —</option>
                              {itemMasters
                                .slice()
                                .sort((a, b) => a.generic_name.localeCompare(b.generic_name, 'ko'))
                                .map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.generic_name} ({m.base_unit})
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <select
                              value={decision?.master_id ?? ''}
                              onChange={(e) =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [r.product_id]: {
                                    master_id: e.target.value || null,
                                    accepted: !!e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-400 focus:border-indigo-400 focus:outline-none"
                            >
                              <option value="">— 직접 선택 —</option>
                              {itemMasters
                                .slice()
                                .sort((a, b) => a.generic_name.localeCompare(b.generic_name, 'ko'))
                                .map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.generic_name} ({m.base_unit})
                                  </option>
                                ))}
                            </select>
                          )}
                        </td>

                        {/* 신뢰도 */}
                        <td className="border-b px-3 py-2">
                          {hasMatch ? (
                            <ConfidenceBadge value={r.confidence} />
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>

                        {/* 근거 */}
                        <td className="border-b px-3 py-2 text-slate-500 max-w-[180px]">
                          <span className="line-clamp-2">{r.reason}</span>
                        </td>

                        {/* 연결 토글 */}
                        <td className="border-b px-3 py-2 text-center">
                          <button
                            type="button"
                            disabled={!decision?.master_id}
                            onClick={() =>
                              setDecisions((prev) => ({
                                ...prev,
                                [r.product_id]: {
                                  ...prev[r.product_id],
                                  accepted: !prev[r.product_id]?.accepted,
                                },
                              }))
                            }
                            className={cn(
                              'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors mx-auto disabled:opacity-30',
                              isAccepted
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
                            )}
                          >
                            {isAccepted ? (
                              <><CheckCircle2 size={10} />연결</>
                            ) : (
                              <>건너뜀</>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="shrink-0 flex items-center justify-between border-t bg-white px-5 py-3">
              <p className="text-xs text-slate-400">
                신뢰도 70% 이상은 자동 수락됩니다. 낮은 항목은 직접 검토하세요.
              </p>
              <Button
                onClick={handleLink}
                disabled={linking || reviewStats.accepted === 0}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
              >
                {linking
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Link2 size={14} />
                }
                {linking ? '연결 중...' : `일괄 연결 (${reviewStats.accepted}개)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

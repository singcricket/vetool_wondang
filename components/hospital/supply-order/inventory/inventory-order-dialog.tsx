'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2, ShoppingCart, GitMerge, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  createOrder,
  findDraftOrdersByVendor,
  appendOrderItems,
} from '@/lib/actions/supply-order/order-actions'

export type OrderDraftItem = {
  item_master_id: string
  generic_name: string
  base_unit: string
  quantity: number
  default_vendor_id: string | null
}

interface Props {
  hosId: string
  items: OrderDraftItem[]
  vendors: { id: string; name: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type ItemState = {
  quantity: number
  vendor_id: string
}

type DraftOrder = { id: string; order_date: string; item_count: number }
// 'new' | orderId(string) — 합칠 주문서 id 또는 새로 생성
type MergeDecision = 'new' | string

export default function InventoryOrderDialog({
  hosId,
  items,
  vendors,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [orderDate, setOrderDate] = useState(today)
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({})
  const [saving, setSaving] = useState(false)

  // vendorId → 미완료 주문서 목록
  const [draftOrders, setDraftOrders] = useState<Record<string, DraftOrder[]>>({})
  // vendorId → 'new' | orderId
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, MergeDecision>>({})
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!open) return
    setOrderDate(today)
    setDraftOrders({})
    setMergeDecisions({})
    const initial: Record<string, ItemState> = {}
    for (const item of items) {
      initial[item.item_master_id] = {
        quantity: item.quantity,
        vendor_id: item.default_vendor_id ?? '',
      }
    }
    setItemStates(initial)
  }, [open, items])

  const setQty = (id: string, qty: number) =>
    setItemStates((prev) => ({ ...prev, [id]: { ...prev[id], quantity: qty } }))

  const setVendor = (id: string, vendorId: string) =>
    setItemStates((prev) => ({ ...prev, [id]: { ...prev[id], vendor_id: vendorId } }))

  const { grouped, unassigned } = useMemo(() => {
    const g: Record<string, OrderDraftItem[]> = {}
    const u: OrderDraftItem[] = []
    for (const item of items) {
      const vid = itemStates[item.item_master_id]?.vendor_id ?? ''
      if (!vid) u.push(item)
      else { g[vid] = g[vid] ?? []; g[vid].push(item) }
    }
    return { grouped: g, unassigned: u }
  }, [items, itemStates])

  const vendorIds = useMemo(() => Object.keys(grouped).sort().join(','), [grouped])

  const checkDraftOrders = useCallback(async (vids: string[]) => {
    if (!vids.length) return
    setChecking(true)
    try {
      const results = await Promise.all(vids.map((vid) => findDraftOrdersByVendor(hosId, vid)))
      const nextDrafts: Record<string, DraftOrder[]> = {}
      const nextDecisions: Record<string, MergeDecision> = {}
      vids.forEach((vid, i) => {
        nextDrafts[vid] = results[i]
        // 기존 주문서 있으면 가장 최근 것으로 기본 선택, 없으면 새로 생성
        nextDecisions[vid] = results[i].length > 0 ? results[i][0].id : 'new'
      })
      setDraftOrders(nextDrafts)
      setMergeDecisions(nextDecisions)
    } finally {
      setChecking(false)
    }
  }, [hosId])

  useEffect(() => {
    if (!open) return
    const vids = vendorIds ? vendorIds.split(',') : []
    checkDraftOrders(vids)
  }, [open, vendorIds, checkDraftOrders])

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id

  const canSubmit = unassigned.length === 0 && items.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSaving(true)
      let mergedCount = 0
      let createdCount = 0

      for (const [vendorId, groupItems] of Object.entries(grouped)) {
        const orderItems = groupItems.map((item) => ({
          item_master_id: item.item_master_id,
          quantity: itemStates[item.item_master_id]?.quantity ?? item.quantity,
          unit: item.base_unit,
          units_per_order_unit: 1,
          unit_price: '',
          memo: '',
        }))

        const decision = mergeDecisions[vendorId] ?? 'new'

        if (decision !== 'new') {
          await appendOrderItems(hosId, decision, orderItems)
          mergedCount++
        } else {
          await createOrder(hosId, vendorId, {
            order_date: orderDate,
            vendor_contact: '',
            memo: '',
            items: orderItems,
          })
          createdCount++
        }
      }

      const parts: string[] = []
      if (mergedCount) parts.push(`${mergedCount}개 주문서에 품목 추가`)
      if (createdCount) parts.push(`${createdCount}개 주문서 신규 생성`)
      toast.success(parts.join(' · ') + '되었습니다.')

      onOpenChange(false)
      onSuccess()
      router.refresh()
    } catch {
      toast.error('주문서 처리에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="text-base">주문 검토</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-5">

            {/* 신규 주문서 생성 시 사용할 주문일 */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                신규 주문서 주문일
                <span className="ml-1 font-normal text-slate-400">(기존 주문서 합산 시 미사용)</span>
              </Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* 업체 미지정 */}
            {unassigned.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-500" />
                  <p className="text-xs font-semibold text-amber-700">
                    업체 미지정 ({unassigned.length}개) — 업체를 선택해야 주문 가능합니다
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {unassigned.map((item) => (
                    <ItemRow
                      key={item.item_master_id}
                      item={item}
                      state={itemStates[item.item_master_id]}
                      vendors={vendors}
                      onQtyChange={(q) => setQty(item.item_master_id, q)}
                      onVendorChange={(v) => setVendor(item.item_master_id, v)}
                      highlight
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 업체별 그룹 */}
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                기존 주문서 확인 중...
              </div>
            ) : (
              Object.entries(grouped).map(([vendorId, groupItems]) => {
                const drafts = draftOrders[vendorId] ?? []
                const decision = mergeDecisions[vendorId] ?? 'new'

                return (
                  <div key={vendorId} className="rounded-lg border p-3 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">
                      {vendorName(vendorId)}
                      <span className="ml-1 font-normal text-slate-400">{groupItems.length}개 품목</span>
                    </p>

                    {/* 주문서 선택 */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-400">주문서 선택</p>
                      <div className="flex flex-col gap-1.5">

                        {/* 기존 주문서 목록 */}
                        {drafts.map((draft) => (
                          <button
                            key={draft.id}
                            type="button"
                            onClick={() => setMergeDecisions((prev) => ({ ...prev, [vendorId]: draft.id }))}
                            className={cn(
                              'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[11px] transition-colors',
                              decision === draft.id
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40',
                            )}
                          >
                            <GitMerge size={12} className={decision === draft.id ? 'text-indigo-500' : 'text-slate-300'} />
                            <div className="flex-1">
                              <span className="font-medium">{draft.order_date}</span>
                              <span className="ml-1.5 text-slate-400">작성중 · {draft.item_count}개 품목</span>
                            </div>
                            {decision === draft.id && (
                              <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                                선택됨
                              </span>
                            )}
                          </button>
                        ))}

                        {/* 새 주문서 생성 */}
                        <button
                          type="button"
                          onClick={() => setMergeDecisions((prev) => ({ ...prev, [vendorId]: 'new' }))}
                          className={cn(
                            'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[11px] transition-colors',
                            decision === 'new'
                              ? 'border-teal-400 bg-teal-50 text-teal-800'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:bg-teal-50/40',
                          )}
                        >
                          <PlusCircle size={12} className={decision === 'new' ? 'text-teal-500' : 'text-slate-300'} />
                          <span className="flex-1 font-medium">새 주문서 생성</span>
                          {decision === 'new' && (
                            <span className="shrink-0 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-600">
                              선택됨
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 품목 목록 */}
                    <div className="flex flex-col gap-2 border-t pt-2">
                      {groupItems.map((item) => (
                        <ItemRow
                          key={item.item_master_id}
                          item={item}
                          state={itemStates[item.item_master_id]}
                          vendors={vendors}
                          onQtyChange={(q) => setQty(item.item_master_id, q)}
                          onVendorChange={(v) => setVendor(item.item_master_id, v)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="shrink-0 border-t px-5 py-3">
          {unassigned.length > 0 && (
            <p className="mb-2 text-center text-xs text-amber-600">
              업체 미지정 품목 {unassigned.length}개를 먼저 배정하세요.
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || saving || checking}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
          >
            {saving
              ? <Loader2 size={14} className="mr-1 animate-spin" />
              : <ShoppingCart size={14} className="mr-1" />}
            {saving ? '처리 중...' : submitLabel(grouped, mergeDecisions)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function submitLabel(
  grouped: Record<string, OrderDraftItem[]>,
  decisions: Record<string, MergeDecision>,
): string {
  const vendorIds = Object.keys(grouped)
  const mergeCount = vendorIds.filter((vid) => (decisions[vid] ?? 'new') !== 'new').length
  const newCount = vendorIds.length - mergeCount

  if (mergeCount > 0 && newCount > 0) return `통합 ${mergeCount} · 신규 ${newCount} 주문서 처리`
  if (mergeCount > 0) return `${mergeCount}개 주문서에 품목 추가`
  return `${newCount}개 업체 주문서 생성`
}

function ItemRow({
  item,
  state,
  vendors,
  onQtyChange,
  onVendorChange,
  highlight = false,
}: {
  item: OrderDraftItem
  state: ItemState | undefined
  vendors: { id: string; name: string }[]
  onQtyChange: (q: number) => void
  onVendorChange: (v: string) => void
  highlight?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', highlight && 'rounded bg-amber-50/60 px-1')}>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
        {item.generic_name}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Input
          type="number"
          min="1"
          value={state?.quantity ?? item.quantity}
          onChange={(e) => onQtyChange(Number(e.target.value))}
          className="h-7 w-16 text-right text-xs"
        />
        <span className="text-[11px] text-slate-400">{item.base_unit}</span>
      </div>
      <select
        value={state?.vendor_id ?? ''}
        onChange={(e) => onVendorChange(e.target.value)}
        className={cn(
          'h-7 w-28 rounded-md border border-input bg-background px-2 text-[11px] shadow-sm outline-none focus:ring-1 focus:ring-teal-400',
          !state?.vendor_id && 'border-amber-300 text-amber-600',
        )}
      >
        <option value="">업체 선택</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
    </div>
  )
}

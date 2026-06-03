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
  findDraftOrderByVendorDate,
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

type ExistingOrder = { id: string; item_count: number }
type MergeDecision = 'merge' | 'new'

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

  // 기존 주문서 조회 결과: vendorId → ExistingOrder | null
  const [existingOrders, setExistingOrders] = useState<Record<string, ExistingOrder | null>>({})
  // 통합 여부 결정: vendorId → 'merge' | 'new'
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, MergeDecision>>({})
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!open) return
    setOrderDate(new Date().toISOString().split('T')[0])
    setExistingOrders({})
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

  // 업체별로 그룹핑
  const { grouped, unassigned } = useMemo(() => {
    const g: Record<string, OrderDraftItem[]> = {}
    const u: OrderDraftItem[] = []
    for (const item of items) {
      const vid = itemStates[item.item_master_id]?.vendor_id ?? ''
      if (!vid) {
        u.push(item)
      } else {
        g[vid] = g[vid] ?? []
        g[vid].push(item)
      }
    }
    return { grouped: g, unassigned: u }
  }, [items, itemStates])

  // 업체 목록이 바뀌거나 날짜가 바뀌면 기존 주문서 조회
  const vendorIds = useMemo(() => Object.keys(grouped).sort().join(','), [grouped])

  const checkExistingOrders = useCallback(async (date: string, vids: string[]) => {
    if (!vids.length || !date) return
    setChecking(true)
    try {
      const results = await Promise.all(
        vids.map((vid) => findDraftOrderByVendorDate(hosId, vid, date)),
      )
      const next: Record<string, ExistingOrder | null> = {}
      const decisions: Record<string, MergeDecision> = {}
      vids.forEach((vid, i) => {
        next[vid] = results[i]
        // 기존 주문서가 있으면 기본값 'merge', 없으면 'new'
        decisions[vid] = results[i] ? 'merge' : 'new'
      })
      setExistingOrders(next)
      setMergeDecisions(decisions)
    } finally {
      setChecking(false)
    }
  }, [hosId])

  useEffect(() => {
    if (!open) return
    const vids = vendorIds ? vendorIds.split(',') : []
    checkExistingOrders(orderDate, vids)
  }, [open, orderDate, vendorIds, checkExistingOrders])

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id

  const canSubmit = unassigned.length === 0 && items.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSaving(true)
      const vendorGroups = Object.entries(grouped)
      let mergedCount = 0
      let createdCount = 0

      for (const [vendorId, groupItems] of vendorGroups) {
        const orderItems = groupItems.map((item) => ({
          item_master_id: item.item_master_id,
          quantity: itemStates[item.item_master_id]?.quantity ?? item.quantity,
          unit: item.base_unit,
          units_per_order_unit: 1,
          unit_price: '',
          memo: '',
        }))

        const decision = mergeDecisions[vendorId] ?? 'new'
        const existing = existingOrders[vendorId]

        if (decision === 'merge' && existing) {
          await appendOrderItems(hosId, existing.id, orderItems)
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

            {/* 주문일 */}
            <div className="space-y-1.5">
              <Label className="text-xs">주문일</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="text-sm"
                />
                {checking && <Loader2 size={14} className="shrink-0 animate-spin text-slate-400" />}
              </div>
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
            {Object.entries(grouped).map(([vendorId, groupItems]) => {
              const existing = existingOrders[vendorId]
              const decision = mergeDecisions[vendorId] ?? 'new'

              return (
                <div key={vendorId} className="rounded-lg border p-3 space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    {vendorName(vendorId)}
                    <span className="ml-1 font-normal text-slate-400">{groupItems.length}개 품목</span>
                  </p>

                  {/* 기존 주문서 통합 옵션 */}
                  {existing && (
                    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2.5 space-y-2">
                      <p className="text-[11px] font-medium text-indigo-700">
                        {orderDate} 동일 업체 주문서가 있습니다 (기존 {existing.item_count}개 품목)
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMergeDecisions((prev) => ({ ...prev, [vendorId]: 'merge' }))}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1 rounded-md border py-1.5 text-[11px] font-medium transition-colors',
                            decision === 'merge'
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300',
                          )}
                        >
                          <GitMerge size={11} /> 기존 주문서에 추가 (추천)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMergeDecisions((prev) => ({ ...prev, [vendorId]: 'new' }))}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1 rounded-md border py-1.5 text-[11px] font-medium transition-colors',
                            decision === 'new'
                              ? 'border-slate-600 bg-slate-600 text-white'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400',
                          )}
                        >
                          <PlusCircle size={11} /> 새 주문서 생성
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
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
            })}
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
            {saving ? '처리 중...' : submitLabel(grouped, mergeDecisions, existingOrders)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function submitLabel(
  grouped: Record<string, OrderDraftItem[]>,
  decisions: Record<string, MergeDecision>,
  existing: Record<string, ExistingOrder | null>,
): string {
  const mergeCount = Object.keys(grouped).filter(
    (vid) => (decisions[vid] ?? 'new') === 'merge' && existing[vid],
  ).length
  const newCount = Object.keys(grouped).length - mergeCount

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

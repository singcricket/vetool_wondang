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
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/actions/supply-order/order-actions'

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

  useEffect(() => {
    if (!open) return
    setOrderDate(new Date().toISOString().split('T')[0])
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

  const canSubmit = unassigned.length === 0 && items.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      setSaving(true)
      const vendorGroups = Object.entries(grouped)
      await Promise.all(
        vendorGroups.map(([vendorId, groupItems]) =>
          createOrder(hosId, vendorId, {
            order_date: orderDate,
            vendor_contact: '',
            memo: '',
            items: groupItems.map((item) => ({
              item_master_id: item.item_master_id,
              quantity: itemStates[item.item_master_id]?.quantity ?? item.quantity,
              unit: item.base_unit,
              units_per_order_unit: 1,
              unit_price: '',
              memo: '',
            })),
          })
        )
      )
      const orderCount = vendorGroups.length
      toast.success(`${orderCount}개 업체 주문서가 생성되었습니다.`)
      onOpenChange(false)
      onSuccess()
      router.refresh()
    } catch {
      toast.error('주문서 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id

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
            {Object.entries(grouped).map(([vendorId, groupItems]) => (
              <div key={vendorId} className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">
                  {vendorName(vendorId)}
                  <span className="ml-1 font-normal text-slate-400">{groupItems.length}개 품목</span>
                </p>
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
            ))}
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
            disabled={!canSubmit || saving}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
          >
            {saving
              ? <Loader2 size={14} className="mr-1 animate-spin" />
              : <ShoppingCart size={14} className="mr-1" />}
            {saving
              ? '주문서 생성 중...'
              : `${Object.keys(grouped).length}개 업체 주문서 생성`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
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

'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MinusCircle, Package, AlertTriangle, PackageX } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getInventoryBatches, recordUsage } from '@/lib/actions/supply-order/inventory-actions'
import type { InventoryBatch } from '@/lib/actions/supply-order/inventory-actions'
import type { InventoryItem } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  item: InventoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InventoryUseSheet({ hosId, item, open, onOpenChange }: Props) {
  const router = useRouter()
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !item) return
    setQuantities({})
    setMemo('')
    setBatches([])
    setLoading(true)
    getInventoryBatches(hosId, item.item_master_id)
      .then(setBatches)
      .catch(() => toast.error('제품 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [open, item, hosId])

  if (!item) return null

  const batchKey = (b: InventoryBatch) => b.item_product_id ?? '__unspecified__'

  const entries = batches.filter((b) => Number(quantities[batchKey(b)]) > 0)
  const hasAnyQty = entries.length > 0

  const handleSubmit = async () => {
    if (!hasAnyQty) return
    try {
      setSaving(true)
      for (const batch of entries) {
        await recordUsage(
          hosId,
          item.item_master_id,
          batch.item_product_id,
          Number(quantities[batchKey(batch)]),
          item.base_unit,
          memo,
        )
      }
      const total = entries.reduce((sum, b) => sum + Number(quantities[batchKey(b)]), 0)
      toast.success(`${item.generic_name} ${total}${item.base_unit} 사용 기록 완료`)
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-5 pb-8 pt-5"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left text-base">
            {item.generic_name}
            <span className="ml-2 text-sm font-normal text-slate-400">사용 기록</span>
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-slate-300" />
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <Package size={30} strokeWidth={1.2} />
            <p className="text-sm">입고된 제품 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[11px] text-slate-400">
              사용한 제품의 수량을 입력하세요. 미입력 항목은 기록되지 않습니다.
            </p>

            <div className="flex flex-col gap-2">
              {batches.map((batch) => {
                const key = batchKey(batch)
                const isUnspecified = batch.item_product_id === null
                const qty = quantities[key] ?? ''
                const isOver = Number(qty) > 0 && Number(qty) > batch.current_stock
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded-lg border px-4 py-3 transition-colors',
                      isUnspecified && 'border-dashed',
                      Number(qty) > 0 ? 'border-teal-300 bg-teal-50/40' : 'bg-white',
                      isOver && 'border-amber-300 bg-amber-50/40',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isUnspecified && <PackageX size={13} className="shrink-0 text-slate-400" />}
                          <p className={cn(
                            'truncate text-sm font-medium',
                            isUnspecified ? 'text-slate-400' : 'text-slate-800',
                          )}>
                            {batch.brand_name}
                          </p>
                        </div>
                        {!isUnspecified && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {batch.manufacturer && <span className="mr-2">{batch.manufacturer}</span>}
                            {batch.specification && <span className="mr-2 text-slate-300">|</span>}
                            {batch.specification && <span>{batch.specification}</span>}
                          </p>
                        )}
                        {isUnspecified && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            제품을 지정하지 않고 입고된 수량
                          </p>
                        )}
                        <p className="mt-1 text-[11px]">
                          <span className="text-slate-400">재고 </span>
                          <span className={cn(
                            'font-semibold',
                            batch.current_stock <= 0 ? 'text-slate-300' : 'text-slate-700',
                          )}>
                            {batch.current_stock}
                          </span>
                          <span className="text-slate-400"> {item.base_unit}</span>
                          {batch.last_in_date && (
                            <span className="ml-2 text-slate-300">
                              입고 {batch.last_in_date.slice(0, 10)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={qty}
                          onChange={(e) =>
                            setQuantities((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder="0"
                          className={cn(
                            'w-20 text-right text-sm',
                            isOver && 'border-amber-400 focus-visible:ring-amber-400',
                          )}
                        />
                        <span className="w-6 text-xs text-slate-400">{item.base_unit}</span>
                      </div>
                    </div>
                    {isOver && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600">
                        <AlertTriangle size={11} />
                        재고보다 많습니다. 음수 재고로 기록됩니다.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">메모 (선택)</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="사용 사유, 환자명 등"
                className="resize-none text-xs"
                rows={2}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!hasAnyQty || saving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40"
            >
              {saving
                ? <Loader2 size={14} className="mr-1 animate-spin" />
                : <MinusCircle size={14} className="mr-1" />}
              {saving ? '저장 중...' : '사용 기록'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

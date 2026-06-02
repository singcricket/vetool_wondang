'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createDelivery } from '@/lib/actions/supply-order/delivery-actions'
import type { Order, DeliveryFormInput } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DeliveryCreateSheet({ hosId, order, open, onOpenChange }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<DeliveryFormInput>({
    delivery_date: today,
    vendor_deliverer: '',
    memo: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm({ delivery_date: new Date().toISOString().split('T')[0], vendor_deliverer: '', memo: '' })
  }, [open])

  const set = <K extends keyof DeliveryFormInput>(key: K, value: DeliveryFormInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    try {
      setSaving(true)
      await createDelivery(hosId, order.vendor_id, order.id, form)
      toast.success('납품 확인서가 생성되었습니다.')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v)
  }

  const vendor = order.vendor as any

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">납품 확인서 생성</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">

          {/* 주문 요약 */}
          <div className="rounded-lg border bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-600">{vendor?.name ?? '업체'}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              주문일: {order.order_date} · 품목 {order.order_items?.length ?? 0}종
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700">{item.item_master?.generic_name}</span>
                  <span className="text-slate-500">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 납품 기본 정보 */}
          <div className="space-y-1.5">
            <Label className="text-xs">납품일 *</Label>
            <Input
              type="date"
              value={form.delivery_date}
              onChange={(e) => set('delivery_date', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">도매상 납품 담당자</Label>
            <Input
              value={form.vendor_deliverer}
              onChange={(e) => set('vendor_deliverer', e.target.value)}
              placeholder="납품 담당자명 (자유 입력)"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              className="resize-none text-xs"
              rows={2}
              placeholder="납품 관련 특이사항"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            납품 확인서 생성 후 <strong>품목 검수(AI 매핑)</strong>를 진행합니다.
            도매상 납품서(엑셀/사진)를 업로드하면 AI가 자동으로 품목을 매핑합니다.
          </div>
        </div>

        <div className="shrink-0 border-t pt-3">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {saving
              ? <Loader2 size={14} className="mr-1 animate-spin" />
              : <PackageCheck size={14} className="mr-1" />}
            {saving ? '저장 중...' : '납품 확인서 생성'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

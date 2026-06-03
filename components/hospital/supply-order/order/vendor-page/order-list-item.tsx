'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronRight, Trash2, SendHorizonal, Loader2, Pencil, FileText, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { updateOrderStatus, deleteOrder } from '@/lib/actions/supply-order/order-actions'
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  type Order,
} from '@/types/hospital/supply-order-type'

interface Props {
  order: Order
  hosId: string
  vendorName?: string
  onClick: () => void
  onEdit?: () => void
}

function formatOrderText(order: Order, vendorName: string): string {
  const items = order.order_items ?? []
  const lines: string[] = []
  lines.push(`업체: ${vendorName}`)
  lines.push(`주문일: ${order.order_date}`)
  lines.push(`상태: ${ORDER_STATUS_LABEL[order.status]}`)
  if (order.vendor_contact) lines.push(`담당자: ${order.vendor_contact}`)
  lines.push('')
  lines.push(`품목 목록 (${items.length}종):`)
  lines.push('')
  items.forEach((item, i) => {
    const name = item.item_master?.generic_name ?? '—'
    const qty = item.units_per_order_unit > 1
      ? `${item.quantity} ${item.unit} (× ${item.units_per_order_unit}${item.item_master?.base_unit ?? ''})`
      : `${item.quantity} ${item.unit}`
    const price = item.unit_price != null ? `  단가: ${item.unit_price.toLocaleString()}원` : ''
    lines.push(` ${i + 1}. ${name}`)
    lines.push(`    수량: ${qty}${price}`)
    if (item.memo) lines.push(`    메모: ${item.memo}`)
  })
  if (order.memo) {
    lines.push('')
    lines.push(`메모: ${order.memo}`)
  }
  return lines.join('\n')
}

export default function OrderListItem({ order, hosId, vendorName = '업체', onClick, onEdit }: Props) {
  const [loading, setLoading] = useState(false)
  const [txtOpen, setTxtOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const orderText = formatOrderText(order, vendorName)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('클립보드 복사에 실패했습니다.')
    }
  }

  const itemCount = order.order_items?.length ?? 0

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setLoading(true)
      await updateOrderStatus(hosId, order.id, 'ordered')
      toast.success('주문 완료 처리되었습니다.')
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('주문서를 삭제하시겠습니까?')) return
    try {
      setLoading(true)
      await deleteOrder(hosId, order.id)
      toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <li
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{order.order_date}</span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold',
              ORDER_STATUS_COLOR[order.status],
            )}
          >
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          품목 {itemCount}종
          {order.vendor_contact && ` · 담당: ${order.vendor_contact}`}
          {order.memo && ` · ${order.memo}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {/* txt 버튼 */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-slate-400 hover:text-slate-600"
          onClick={(e) => { e.stopPropagation(); setTxtOpen(true) }}
          title="텍스트로 보기"
        >
          <FileText size={13} />
        </Button>

        {/* 수정 버튼 — 진행중 주문 전체 */}
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-slate-600"
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); onEdit() }}
          >
            <Pencil size={13} />
          </Button>
        )}

        {order.status === 'draft' && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-red-500"
              disabled={loading}
              onClick={handleDelete}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 bg-teal-600 px-2 text-xs hover:bg-teal-700"
              disabled={loading}
              onClick={handleSend}
            >
              <SendHorizonal size={12} />
              주문 완료
            </Button>
          </>
        )}
        <ChevronRight size={15} className="text-slate-300" onClick={onClick} />
      </div>

      {/* 텍스트 보기 Dialog — stopPropagation으로 li.onClick 버블링 차단 */}
      <div onClick={(e) => e.stopPropagation()}>
      <Dialog open={txtOpen} onOpenChange={setTxtOpen}>
        <DialogContent className="grid-rows-[auto_1fr] h-[75vh] w-full max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between border-b px-5 py-3.5">
            <DialogTitle className="text-sm">
              {vendorName}
              <span className="ml-2 font-normal text-slate-400">{order.order_date} 주문</span>
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className={cn(
                'h-7 gap-1.5 text-xs transition-colors',
                copied && 'border-emerald-300 bg-emerald-50 text-emerald-700',
              )}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '복사됨!' : '클립보드 복사'}
            </Button>
          </DialogHeader>
          <textarea
            readOnly
            value={orderText}
            className="min-h-0 w-full resize-none overflow-y-auto px-5 py-4 font-mono text-xs text-slate-700 focus:outline-none"
          />
        </DialogContent>
      </Dialog>
      </div>
    </li>
  )
}

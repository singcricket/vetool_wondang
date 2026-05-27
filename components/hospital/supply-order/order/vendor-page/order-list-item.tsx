'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, Trash2, SendHorizonal, Loader2, Pencil } from 'lucide-react'
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
  onClick: () => void
  onEdit?: () => void
}

export default function OrderListItem({ order, hosId, onClick, onEdit }: Props) {
  const [loading, setLoading] = useState(false)

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
    </li>
  )
}

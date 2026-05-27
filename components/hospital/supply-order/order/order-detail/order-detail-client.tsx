'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft, SendHorizonal, Truck, PackageCheck,
  CheckCircle2, XCircle, Loader2, Trash2, RotateCcw,
  Pencil, Check, X,
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { updateOrderStatus, deleteOrder, updateOrderItemMemo, updateOrderItemStatus } from '@/lib/actions/supply-order/order-actions'
import OrderStatusBar from './order-status-bar'
import DeliveryCreateSheet from './delivery-create-sheet'
import type { Order, Delivery, OrderStatus, OrderItemStatus } from '@/types/hospital/supply-order-type'
import {
  ORDER_STATUS_LABEL, ORDER_STATUS_COLOR,
  DELIVERY_STATUS_LABEL, DELIVERY_STATUS_COLOR,
  ORDER_ITEM_STATUSES, ORDER_ITEM_STATUS_LABEL, ORDER_ITEM_STATUS_COLOR,
} from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  order: Order
  deliveries: Delivery[]
}

type ActionDef = { label: string; next: OrderStatus; icon: React.ElementType; color: string }

// 정방향 액션
const NEXT_ACTIONS: Partial<Record<OrderStatus, ActionDef[]>> = {
  draft: [
    { label: '주문 완료', next: 'ordered', icon: SendHorizonal, color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '주문 취소', next: 'cancelled', icon: XCircle, color: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
  ],
  ordered: [
    { label: '도매상 확인', next: 'confirmed', icon: CheckCircle2, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: '주문 취소', next: 'cancelled', icon: XCircle, color: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
  ],
  confirmed: [
    { label: '배송 시작', next: 'delivering', icon: Truck, color: 'bg-amber-500 hover:bg-amber-600' },
  ],
  delivering: [
    { label: '반품 처리', next: 'returned', icon: RotateCcw, color: 'bg-rose-100 hover:bg-rose-200 text-rose-700' },
  ],
}

// 이전 단계 되돌리기
const PREV_ACTIONS: Partial<Record<OrderStatus, ActionDef>> = {
  ordered:   { label: '작성중으로 되돌리기', next: 'draft',     icon: ChevronLeft, color: 'bg-slate-100 hover:bg-slate-200 text-slate-500' },
  confirmed: { label: '주문완료로 되돌리기', next: 'ordered',   icon: ChevronLeft, color: 'bg-slate-100 hover:bg-slate-200 text-slate-500' },
  delivering:{ label: '도매상확인으로 되돌리기', next: 'confirmed', icon: ChevronLeft, color: 'bg-slate-100 hover:bg-slate-200 text-slate-500' },
  delivered: { label: '배송중으로 되돌리기', next: 'delivering', icon: ChevronLeft, color: 'bg-slate-100 hover:bg-slate-200 text-slate-500' },
}

export default function OrderDetailClient({ hosId, order, deliveries }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [deliverySheetOpen, setDeliverySheetOpen] = useState(false)
  const [memoEditId, setMemoEditId] = useState<string | null>(null)
  const [memoValue, setMemoValue] = useState('')
  const [memoSaving, setMemoSaving] = useState(false)
  const [itemStatusLoading, setItemStatusLoading] = useState<string | null>(null)

  const vendor = order.vendor as any

  const handleStatusChange = async (next: OrderStatus) => {
    if (!confirm(`상태를 "${ORDER_STATUS_LABEL[next]}"(으)로 변경하시겠습니까?`)) return
    try {
      setLoading(next)
      await updateOrderStatus(hosId, order.id, next)
      toast.success(`${ORDER_STATUS_LABEL[next]}으로 변경되었습니다.`)
      router.refresh()
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm('주문서를 삭제하시겠습니까?')) return
    try {
      setLoading('delete')
      await deleteOrder(hosId, order.id)
      toast.success('삭제되었습니다.')
      router.push(`/hospital/${hosId}/supply-order/order/${order.vendor_id}` as any)
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const handleItemStatusChange = async (itemId: string, status: OrderItemStatus) => {
    try {
      setItemStatusLoading(itemId)
      await updateOrderItemStatus(hosId, itemId, status)
      router.refresh()
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setItemStatusLoading(null)
    }
  }

  const openMemoEdit = (itemId: string, current: string | null) => {
    setMemoEditId(itemId)
    setMemoValue(current ?? '')
  }

  const cancelMemoEdit = () => {
    setMemoEditId(null)
    setMemoValue('')
  }

  const saveMemo = async (itemId: string) => {
    try {
      setMemoSaving(true)
      await updateOrderItemMemo(hosId, itemId, memoValue)
      toast.success('메모가 저장되었습니다.')
      setMemoEditId(null)
      router.refresh()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setMemoSaving(false)
    }
  }

  const nextActions = NEXT_ACTIONS[order.status] ?? []
  const prevAction = PREV_ACTIONS[order.status] ?? null
  const canCreateDelivery = ['confirmed', 'delivering', 'partial'].includes(order.status) && deliveries.length === 0
  // ordered 이후 delivered 이전까지 품목별 상태 수정 가능
  const canEditItemStatus = ['ordered', 'confirmed', 'delivering', 'partial', 'delivered'].includes(order.status)

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={() => router.push(`/hospital/${hosId}/supply-order/order/${order.vendor_id}` as any)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
      >
        <ChevronLeft size={14} />
        {vendor?.name ?? '업체'} 목록으로
      </button>

      {/* 주문 헤더 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800">{order.order_date}</span>
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', ORDER_STATUS_COLOR[order.status])}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{vendor?.name}</p>
          </div>
          {order.status === 'draft' && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-red-500"
              onClick={handleDelete}
              disabled={loading === 'delete'}
            >
              {loading === 'delete' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </Button>
          )}
        </div>

        {/* 상태 진행 바 */}
        <OrderStatusBar status={order.status} />

        {/* 상세 정보 */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[11px] text-slate-500">
          {order.vendor_contact && <span>업체담당: {order.vendor_contact}</span>}
          {order.memo && <span>메모: {order.memo}</span>}
        </div>
      </div>

      {/* 주문 품목 */}
      <section>
        <p className="mb-2 text-xs font-semibold text-slate-600">주문 품목</p>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">품목</th>
                <th className="border-b px-3 py-2 text-right font-semibold text-slate-500 whitespace-nowrap">수량</th>
                {canEditItemStatus && (
                  <th className="border-b px-3 py-2 text-center font-semibold text-slate-500 whitespace-nowrap">상태</th>
                )}
                <th className="border-b px-3 py-2 text-left font-semibold text-slate-500">메모</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, idx) => {
                const isEditing = memoEditId === item.id
                return (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>

                    {/* 품목명 */}
                    <td className="border-b px-3 py-2">
                      <div className="font-medium text-slate-800">{item.item_master?.generic_name}</div>
                      {item.item_master?.category && (
                        <div className="text-[10px] text-slate-400">{item.item_master.category}</div>
                      )}
                    </td>

                    {/* 수량 */}
                    <td className="border-b px-3 py-2 text-right whitespace-nowrap text-slate-600">
                      {item.quantity} {item.unit}
                    </td>

                    {/* 상태 select */}
                    {canEditItemStatus && (
                      <td className="border-b px-3 py-2 text-center">
                        {itemStatusLoading === item.id ? (
                          <Loader2 size={13} className="mx-auto animate-spin text-slate-400" />
                        ) : (
                          <select
                            value={item.item_status}
                            onChange={(e) => handleItemStatusChange(item.id, e.target.value as any)}
                            className={cn(
                              'rounded border-0 px-1.5 py-0.5 text-[11px] font-medium outline-none cursor-pointer',
                              ORDER_ITEM_STATUS_COLOR[item.item_status],
                            )}
                          >
                            {ORDER_ITEM_STATUSES.map((s) => (
                              <option key={s} value={s}>{ORDER_ITEM_STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    )}

                    {/* 메모 */}
                    <td className="border-b px-3 py-2">
                      {isEditing ? (
                        <div>
                          <textarea
                            value={memoValue}
                            onChange={(e) => setMemoValue(e.target.value)}
                            className="w-full resize-none rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-teal-400"
                            rows={2}
                            placeholder="메모 입력"
                            autoFocus
                          />
                          <div className="mt-1 flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={cancelMemoEdit}
                              disabled={memoSaving}
                              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100"
                            >
                              <X size={10} /> 취소
                            </button>
                            <button
                              type="button"
                              onClick={() => saveMemo(item.id)}
                              disabled={memoSaving}
                              className="flex items-center gap-0.5 rounded bg-teal-600 px-1.5 py-0.5 text-[11px] text-white hover:bg-teal-700 disabled:opacity-50"
                            >
                              {memoSaving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openMemoEdit(item.id, item.memo)}
                          className="group flex w-full items-center gap-1 text-left"
                        >
                          <span className={cn('flex-1', item.memo ? 'text-slate-500' : 'text-slate-300')}>
                            {item.memo || '메모 추가'}
                          </span>
                          <Pencil size={11} className="shrink-0 text-slate-200 group-hover:text-slate-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 납품 확인서 목록 */}
      {deliveries.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold text-slate-600">납품 확인서</p>
          <ul className="flex flex-col gap-2">
            {deliveries.map((delivery) => (
              <li
                key={delivery.id}
                role="button"
                onClick={() => router.push(
                  `/hospital/${hosId}/supply-order/order/${order.vendor_id}/${order.id}/delivery/${delivery.id}` as any
                )}
                className="flex cursor-pointer items-center justify-between rounded-lg border bg-white px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100"
              >
                <div>
                  <span className="text-sm font-medium text-slate-800">{delivery.delivery_date}</span>
                  {delivery.vendor_deliverer && (
                    <span className="ml-2 text-[11px] text-slate-400">담당: {delivery.vendor_deliverer}</span>
                  )}
                </div>
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                  DELIVERY_STATUS_COLOR[delivery.status],
                )}>
                  {DELIVERY_STATUS_LABEL[delivery.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 액션 버튼 영역 */}
      <div className="flex flex-col gap-2">
        {/* 납품 확인서 생성 */}
        {canCreateDelivery && (
          <Button
            onClick={() => setDeliverySheetOpen(true)}
            className="w-full gap-1.5 bg-teal-600 hover:bg-teal-700"
          >
            <PackageCheck size={15} />
            납품 확인서 생성 (입고 검수)
          </Button>
        )}

        {/* 상태 전환 버튼들 */}
        {nextActions.length > 0 && (
          <div className={cn('grid gap-2', nextActions.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {nextActions.map(({ label, next, icon: Icon, color }) => (
              <Button
                key={next}
                onClick={() => handleStatusChange(next)}
                disabled={!!loading}
                className={cn('gap-1.5', color)}
              >
                {loading === next
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Icon size={14} />}
                {label}
              </Button>
            ))}
          </div>
        )}

        {/* 이전 단계 되돌리기 */}
        {prevAction && (
          <Button
            variant="ghost"
            onClick={() => handleStatusChange(prevAction.next)}
            disabled={!!loading}
            className="h-7 w-full gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            {loading === prevAction.next
              ? <Loader2 size={12} className="animate-spin" />
              : <ChevronLeft size={12} />}
            {prevAction.label}
          </Button>
        )}
      </div>

      {/* 납품 확인서 Sheet */}
      <DeliveryCreateSheet
        hosId={hosId}
        order={order}
        open={deliverySheetOpen}
        onOpenChange={setDeliverySheetOpen}
      />
    </div>
  )
}

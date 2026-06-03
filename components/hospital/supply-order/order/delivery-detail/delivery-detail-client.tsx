'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, Pencil, Trash2, Loader2, PackageCheck, CheckCircle2, AlertCircle, Circle, FileSpreadsheet, Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { deleteDeliveryItem } from '@/lib/actions/supply-order/delivery-items-actions'
import { updateDeliveryStatus, deleteDelivery } from '@/lib/actions/supply-order/delivery-actions'
import DeliveryItemFormSheet from './delivery-item-form-sheet'
import DeliveryDirectInputSheet from './delivery-direct-input-sheet'
import UploadReviewSheet from './upload-review-sheet'
import type {
  Delivery, DeliveryItem, DeliveryStatus,
  ItemProduct, Order, OrderItem,
} from '@/types/hospital/supply-order-type'
import { DELIVERY_STATUS_LABEL, DELIVERY_STATUS_COLOR, ORDER_ITEM_STATUS_LABEL } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  order: Order
  delivery: Delivery
  deliveryItems: DeliveryItem[]
  itemProducts: ItemProduct[]
}

const NEXT_STATUS: Partial<Record<DeliveryStatus, { label: string; next: DeliveryStatus; color: string }>> = {
  pending:   { label: '검토 시작', next: 'reviewing', color: 'bg-amber-500 hover:bg-amber-600' },
  reviewing: { label: '검수 완료', next: 'confirmed', color: 'bg-emerald-600 hover:bg-emerald-700' },
}

const PREV_STATUS: Partial<Record<DeliveryStatus, { label: string; prev: DeliveryStatus }>> = {
  reviewing: { label: '확인대기로 되돌리기', prev: 'pending' },
  confirmed: { label: '검토중으로 되돌리기',   prev: 'reviewing' },
}

export default function DeliveryDetailClient({
  hosId, order, delivery, deliveryItems, itemProducts,
}: Props) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<DeliveryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleteDeliveryLoading, setDeleteDeliveryLoading] = useState(false)
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const [directInputOpen, setDirectInputOpen] = useState(false)

  const vendor = order.vendor as any

  const backPath = `/hospital/${hosId}/supply-order/order/${order.vendor_id}/${order.id}` as any

  const handleDelete = async (id: string) => {
    if (!confirm('품목을 삭제하시겠습니까?')) return
    try {
      setDeletingId(id)
      await deleteDeliveryItem(hosId, id)
      toast.success('삭제되었습니다.')
      router.refresh()
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (next: DeliveryStatus) => {
    if (!confirm(`상태를 "${DELIVERY_STATUS_LABEL[next]}"(으)로 변경하시겠습니까?`)) return
    try {
      setStatusLoading(true)
      await updateDeliveryStatus(hosId, delivery.id, next)
      toast.success(`${DELIVERY_STATUS_LABEL[next]}으로 변경되었습니다.`)
      router.refresh()
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDeleteDelivery = async () => {
    if (!confirm('납품 확인서를 삭제하시겠습니까? 등록된 품목도 함께 삭제됩니다.')) return
    try {
      setDeleteDeliveryLoading(true)
      await deleteDelivery(hosId, delivery.id)
      toast.success('납품 확인서가 삭제되었습니다.')
      router.push(backPath)
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setDeleteDeliveryLoading(false)
    }
  }

  const openAdd = () => { setEditItem(null); setSheetOpen(true) }
  const openEdit = (item: DeliveryItem) => { setEditItem(item); setSheetOpen(true) }

  const totalAmount = deliveryItems.reduce(
    (sum, item) => sum + (item.unit_price ?? 0) * item.quantity_received, 0,
  )

  const nextStatus = NEXT_STATUS[delivery.status]
  const prevStatus = PREV_STATUS[delivery.status]
  const orderItems: OrderItem[] = order.order_items ?? []

  // 주문 품목별 납품 현황 계산
  const deliveryByMaster = deliveryItems.reduce<Record<string, number>>((acc, d) => {
    if (d.item_master_id) {
      acc[d.item_master_id] = (acc[d.item_master_id] ?? 0) + d.quantity_received
    }
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={() => router.push(backPath)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
      >
        <ChevronLeft size={14} />
        주문서로 돌아가기
      </button>

      {/* 납품 헤더 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800">{delivery.delivery_date}</span>
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', DELIVERY_STATUS_COLOR[delivery.status])}>
                {DELIVERY_STATUS_LABEL[delivery.status]}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{vendor?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {delivery.status !== 'confirmed' && (
              <button
                type="button"
                onClick={handleDeleteDelivery}
                disabled={deleteDeliveryLoading}
                className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                title="납품 확인서 삭제"
              >
                {deleteDeliveryLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <X size={16} />}
              </button>
            )}
            <PackageCheck size={20} className="text-slate-300" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[11px] text-slate-500">
          {delivery.vendor_deliverer && <span>납품 담당: {delivery.vendor_deliverer}</span>}
          {delivery.memo && <span>메모: {delivery.memo}</span>}
          <span>주문일: {order.order_date}</span>
        </div>
      </div>

      {/* 주문 내역 비교 */}
      {orderItems.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold text-slate-600">
            주문 내역
            <span className="ml-1.5 text-slate-400">({orderItems.length}종)</span>
          </p>
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50 text-[10px] text-slate-400">
                  <th className="px-3 py-2 text-left font-medium">품목명</th>
                  <th className="px-3 py-2 text-right font-medium">주문</th>
                  <th className="px-3 py-2 text-right font-medium">납품</th>
                  <th className="px-2 py-2 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orderItems.map((oi) => {
                  const delivered = oi.item_master_id
                    ? (deliveryByMaster[oi.item_master_id] ?? 0)
                    : 0
                  const isDelivered = delivered > 0
                  const qtyMatch = Math.abs(delivered - oi.quantity) < 0.001

                  return (
                    <tr key={oi.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">
                          {oi.item_master?.generic_name ?? '(알 수 없음)'}
                        </p>
                        {(oi.item_master?.category?.length ?? 0) > 0 && (
                          <p className="text-[10px] text-slate-400">{oi.item_master?.category?.join(', ')}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {oi.quantity} {oi.unit}
                      </td>
                      <td className={cn(
                        'px-3 py-2 text-right font-medium',
                        !isDelivered ? 'text-slate-300' :
                        qtyMatch ? 'text-emerald-600' : 'text-amber-600',
                      )}>
                        {isDelivered ? `${delivered} ${oi.unit}` : '—'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {!isDelivered ? (
                          <Circle size={13} className="mx-auto text-slate-300" />
                        ) : qtyMatch ? (
                          <CheckCircle2 size={13} className="mx-auto text-emerald-500" />
                        ) : (
                          <AlertCircle size={13} className="mx-auto text-amber-500" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {/* 주문 품목 중 item_status가 pending이 아닌 것 표시 */}
            {orderItems.some(oi => oi.item_status !== 'pending') && (
              <div className="flex flex-wrap gap-1.5 border-t bg-slate-50 px-3 py-2">
                {orderItems
                  .filter(oi => oi.item_status !== 'pending')
                  .map(oi => (
                    <span key={oi.id} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500 shadow-sm ring-1 ring-slate-200">
                      {oi.item_master?.generic_name}: {ORDER_ITEM_STATUS_LABEL[oi.item_status]}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 납품 품목 목록 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            납품 품목
            {deliveryItems.length > 0 && (
              <span className="ml-1.5 text-slate-400">({deliveryItems.length}종)</span>
            )}
          </p>
          {delivery.status !== 'confirmed' && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDirectInputOpen(true)}
                className="h-6 gap-1 px-2 text-xs"
              >
                <Plus size={11} />
                직접 입력
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadSheetOpen(true)}
                className="h-6 gap-1 px-2 text-xs text-teal-700 hover:text-teal-800"
                title="Excel 업로드"
              >
                <FileSpreadsheet size={11} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadSheetOpen(true)}
                className="h-6 gap-1 px-2 text-xs text-indigo-700 hover:text-indigo-800"
                title="납품전표 사진 업로드"
              >
                <Camera size={11} />
              </Button>
            </div>
          )}
        </div>

        {deliveryItems.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-slate-50 py-8 text-center text-xs text-slate-400">
            아직 등록된 품목이 없습니다
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {deliveryItems.map((item) => {
              const name = item.item_master?.generic_name ?? item.raw_name
              const subtotal = item.unit_price != null
                ? item.unit_price * item.quantity_received
                : null

              return (
                <div key={item.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{name}</p>
                      {(item.item_master?.category?.length ?? 0) > 0 && (
                        <p className="text-[10px] text-slate-400">{item.item_master?.category?.join(', ')}</p>
                      )}
                    </div>
                    {delivery.status !== 'confirmed' && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-slate-400 hover:text-red-500"
                        >
                          {deletingId === item.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>수령: {item.quantity_received} {item.unit}</span>
                    {item.units_per_package > 1 && (
                      <span>기준단위: {item.base_quantity?.toLocaleString()}</span>
                    )}
                    {item.unit_price != null && (
                      <span>단가: {item.unit_price.toLocaleString()}원</span>
                    )}
                    {subtotal != null && (
                      <span className="font-medium text-teal-600">
                        소계: {subtotal.toLocaleString()}원
                      </span>
                    )}
                    {item.expiry_date && (
                      <span className={cn(
                        new Date(item.expiry_date) < new Date()
                          ? 'font-semibold text-red-500'
                          : '',
                      )}>
                        유통기한: {item.expiry_date}
                      </span>
                    )}
                    {item.lot_number && <span>LOT: {item.lot_number}</span>}
                  </div>

                  {item.memo && (
                    <p className="mt-1 text-[10px] text-slate-400">{item.memo}</p>
                  )}
                </div>
              )
            })}

            {/* 합계 */}
            {totalAmount > 0 && (
              <div className="flex justify-between rounded-lg border bg-slate-50 px-4 py-2.5">
                <span className="text-xs text-slate-500">납품 합계</span>
                <span className="text-sm font-bold text-slate-800">
                  {totalAmount.toLocaleString()}원
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 상태 전환 */}
      <div className="flex flex-col gap-2">
        {nextStatus && (
          <Button
            onClick={() => handleStatusChange(nextStatus.next)}
            disabled={statusLoading}
            className={cn('w-full gap-1.5', nextStatus.color)}
          >
            {statusLoading
              ? <Loader2 size={14} className="animate-spin" />
              : null}
            {nextStatus.label}
          </Button>
        )}
        {prevStatus && (
          <button
            type="button"
            onClick={() => handleStatusChange(prevStatus.prev)}
            disabled={statusLoading}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40"
          >
            ↩ {prevStatus.label}
          </button>
        )}
      </div>

      <DeliveryDirectInputSheet
        hosId={hosId}
        deliveryId={delivery.id}
        vendorId={delivery.vendor_id}
        orderItems={orderItems}
        itemProducts={itemProducts}
        open={directInputOpen}
        onOpenChange={setDirectInputOpen}
      />

      <DeliveryItemFormSheet
        hosId={hosId}
        deliveryId={delivery.id}
        itemProducts={itemProducts}
        orderItems={orderItems}
        editItem={editItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <UploadReviewSheet
        hosId={hosId}
        deliveryId={delivery.id}
        vendorId={delivery.vendor_id}
        itemProducts={itemProducts}
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
      />
    </div>
  )
}

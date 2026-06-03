'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Building2, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import OrderStatusCards from './order-status-cards'
import OrderListItem from './order-list-item'
import NewOrderSheet from './new-order-sheet'
import EditOrderSheet from './edit-order-sheet'
import type { Order, Vendor, ItemMaster } from '@/types/hospital/supply-order-type'
import { ORDER_STATUS_LABEL } from '@/types/hospital/supply-order-type'

// 진행 중 → 배송중 → 완료 → 취소/반려 순 정렬
const STATUS_SORT: Record<string, number> = {
  draft: 0,
  ordered: 1,
  confirmed: 2,
  delivering: 3,
  partial: 4,
  delivered: 5,
  returned: 6,
  rejected: 7,
  cancelled: 8,
}

interface Props {
  hosId: string
  vendor: Vendor
  orders: Order[]
  itemMasters: ItemMaster[]
}

export default function VendorOrderClient({ hosId, vendor, orders, itemMasters }: Props) {
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const router = useRouter()

  const activeOrders = orders.filter((o) =>
    ['draft', 'ordered', 'confirmed', 'delivering', 'partial'].includes(o.status),
  )
  const closedOrders = orders.filter((o) =>
    ['delivered', 'returned', 'rejected', 'cancelled'].includes(o.status),
  )

  const sortedActive = [...activeOrders].sort(
    (a, b) => (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9),
  )

  const representativeContact = vendor.contacts[0]

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* 업체 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100">
            <Building2 size={16} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{vendor.name}</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {vendor.categories.length > 0 && (
                <span>{vendor.categories.join(' · ')}</span>
              )}
              {vendor.representative_phone && (
                <span className="flex items-center gap-0.5">
                  <Phone size={10} />
                  {vendor.representative_phone}
                </span>
              )}
              {representativeContact && (
                <span>담당: {representativeContact.name} {representativeContact.phone}</span>
              )}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setNewOrderOpen(true)}
          className="shrink-0 gap-1 bg-teal-600 hover:bg-teal-700"
        >
          <Plus size={14} />
          새 주문서
        </Button>
      </div>

      {/* 상태 요약 카드 */}
      <OrderStatusCards orders={orders} />

      {/* 진행 중 주문 */}
      {sortedActive.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold text-slate-500">진행 중인 주문</p>
          <ul className="flex flex-col gap-2">
            {sortedActive.map((order) => (
              <OrderListItem
                key={order.id}
                order={order}
                hosId={hosId}
                vendorName={vendor.name}
                onClick={() => router.push(`/hospital/${hosId}/supply-order/order/${vendor.id}/${order.id}` as any)}
                onEdit={() => setEditingOrder(order)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* 완료된 주문 */}
      {closedOrders.length > 0 && (
        <section>
          <details>
            <summary className="mb-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-600">
              완료된 주문 {closedOrders.length}건
            </summary>
            <ul className="mt-2 flex flex-col gap-2 opacity-70">
              {closedOrders.map((order) => (
                <OrderListItem
                  key={order.id}
                  order={order}
                  hosId={hosId}
                  vendorName={vendor.name}
                  onClick={() => router.push(`/hospital/${hosId}/supply-order/order/${vendor.id}/${order.id}` as any)}
                />
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* 주문 없음 */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-slate-400">
          <p className="text-sm">주문 내역이 없습니다.</p>
          <Button size="sm" variant="outline" onClick={() => setNewOrderOpen(true)}>
            첫 주문서 작성
          </Button>
        </div>
      )}

      <NewOrderSheet
        hosId={hosId}
        vendor={vendor}
        itemMasters={itemMasters}
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
      />

      <EditOrderSheet
        hosId={hosId}
        order={editingOrder}
        itemMasters={itemMasters}
        open={editingOrder !== null}
        onOpenChange={(v) => { if (!v) setEditingOrder(null) }}
      />
    </div>
  )
}

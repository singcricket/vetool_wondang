'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronRight, PackageCheck, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { getOrdersByDateRange } from '@/lib/actions/supply-order/order-actions'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/types/hospital/supply-order-type'
import type { Order } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  initialOrders: Order[]
  initialStart: string
  initialEnd: string
}

function toLocalDateString(date: Date) {
  return date.toLocaleDateString('sv-SE') // YYYY-MM-DD
}

function today() {
  return toLocalDateString(new Date())
}

function mondayOfThisWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toLocalDateString(d)
}

function firstOfThisMonth() {
  const d = new Date()
  d.setDate(1)
  return toLocalDateString(d)
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const t = today()
  if (dateStr === t) return `${dateStr} (오늘)`
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === toLocalDateString(yesterday)) return `${dateStr} (어제)`
  return dateStr
}

export default function HistoryClient({ hosId, initialOrders, initialStart, initialEnd }: Props) {
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isPending, startTransition] = useTransition()

  const fetchOrders = (start: string, end: string) => {
    startTransition(async () => {
      const result = await getOrdersByDateRange(hosId, start, end)
      setOrders(result)
    })
  }

  const handleStartChange = (val: string) => {
    setStartDate(val)
    if (val <= endDate) fetchOrders(val, endDate)
  }

  const handleEndChange = (val: string) => {
    setEndDate(val)
    if (startDate <= val) fetchOrders(startDate, val)
  }

  const applyPreset = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    fetchOrders(start, end)
  }

  // 날짜별 그룹
  const grouped = orders.reduce<Record<string, Order[]>>((acc, order) => {
    const d = order.order_date
    if (!acc[d]) acc[d] = []
    acc[d].push(order)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-0">
      {/* 헤더 */}
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">주문내역</h2>
        <p className="mt-0.5 text-xs text-slate-400">기간별 주문 현황을 확인합니다.</p>
      </div>

      {/* 날짜 필터 */}
      <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => handleStartChange(e.target.value)}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-400 focus:outline-none"
          />
          <span className="text-xs text-slate-400">~</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => handleEndChange(e.target.value)}
            className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { label: '오늘', start: today(), end: today() },
            { label: '이번 주', start: mondayOfThisWeek(), end: today() },
            { label: '이번 달', start: firstOfThisMonth(), end: today() },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.start, preset.end)}
              className={cn(
                'rounded-full border px-3 py-0.5 text-[11px] font-medium transition-colors',
                startDate === preset.start && endDate === preset.end
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className={cn('flex flex-col gap-0 p-4', isPending && 'opacity-50 pointer-events-none')}>
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <ClipboardList size={32} strokeWidth={1.2} />
            <p className="text-sm">해당 기간에 주문 내역이 없습니다.</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="mb-5">
              {/* 날짜 구분선 */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {formatDateLabel(date)}
                </span>
                <span className="text-[10px] text-slate-300">
                  {grouped[date].length}건
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {grouped[date].map((order) => {
                  const vendor = order.vendor as any
                  const itemCount = (order.order_items as any[])?.length ?? 0
                  const href = `/hospital/${hosId}/supply-order/order/${order.vendor_id}/${order.id}` as any

                  return (
                    <Link
                      key={order.id}
                      href={href}
                      className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
                    >
                      <PackageCheck size={16} className="shrink-0 text-slate-300" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {vendor?.name ?? '(업체 없음)'}
                          </span>
                          <span className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                            ORDER_STATUS_COLOR[order.status],
                          )}>
                            {ORDER_STATUS_LABEL[order.status]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {itemCount > 0 ? `${itemCount}종 주문` : '품목 없음'}
                          {order.memo && ` · ${order.memo}`}
                        </p>
                      </div>
                      <ChevronRight size={14} className="shrink-0 text-slate-300" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

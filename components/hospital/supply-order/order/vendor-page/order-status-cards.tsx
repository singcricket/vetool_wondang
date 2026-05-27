'use client'

import { cn } from '@/lib/utils/utils'
import { ClipboardList, Truck, CheckCircle2, Archive } from 'lucide-react'
import type { Order } from '@/types/hospital/supply-order-type'

interface Props {
  orders: Order[]
}

export default function OrderStatusCards({ orders }: Props) {
  const active = orders.filter((o) =>
    ['draft', 'ordered', 'confirmed'].includes(o.status),
  ).length
  const delivering = orders.filter((o) => o.status === 'delivering').length
  const delivered = orders.filter((o) =>
    ['delivered', 'partial'].includes(o.status),
  ).length

  // 이번 달 완료
  const now = new Date()
  const thisMonthDone = orders.filter((o) => {
    if (!['delivered', 'partial', 'returned'].includes(o.status)) return false
    const d = new Date(o.updated_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  const cards = [
    {
      label: '진행중',
      value: active,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '배송중',
      value: delivering,
      icon: Truck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '납품완료',
      value: delivered,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: '이번달 처리',
      value: thisMonthDone,
      icon: Archive,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className={cn('flex flex-col items-center rounded-lg border py-3 gap-1', bg)}
        >
          <Icon size={16} className={color} />
          <span className={cn('text-lg font-bold leading-none', color)}>{value}</span>
          <span className="text-[10px] text-slate-500">{label}</span>
        </div>
      ))}
    </div>
  )
}

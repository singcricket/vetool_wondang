import { cn } from '@/lib/utils/utils'
import { Check } from 'lucide-react'
import type { OrderStatus } from '@/types/hospital/supply-order-type'

// 취소/반려/반품은 별도 처리 — 정상 흐름 스텝만 표시
const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'draft',      label: '작성중' },
  { status: 'ordered',    label: '주문완료' },
  { status: 'confirmed',  label: '도매상확인' },
  { status: 'delivering', label: '배송중' },
  { status: 'delivered',  label: '납품완료' },
]

const STEP_IDX: Partial<Record<OrderStatus, number>> = {
  draft: 0, ordered: 1, confirmed: 2, delivering: 3, delivered: 4, partial: 4,
}

interface Props {
  status: OrderStatus
}

export default function OrderStatusBar({ status }: Props) {
  const isTerminal = ['returned', 'rejected', 'cancelled'].includes(status)
  const currentIdx = STEP_IDX[status] ?? 0

  if (isTerminal) {
    const label = status === 'returned' ? '반품' : status === 'rejected' ? '반려' : '취소'
    return (
      <div className="flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 py-2">
        <span className="text-xs font-semibold text-rose-600">{label} 처리됨</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx
        const isActive = idx === currentIdx
        const isLast = idx === STEPS.length - 1

        return (
          <div key={step.status} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1">
              {/* 원 */}
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors',
                  isDone  && 'border-teal-500 bg-teal-500 text-white',
                  isActive && 'border-teal-500 bg-white text-teal-600',
                  !isDone && !isActive && 'border-slate-200 bg-white text-slate-300',
                )}
              >
                {isDone ? <Check size={11} strokeWidth={3} /> : idx + 1}
              </div>
              {/* 라벨 */}
              <span
                className={cn(
                  'text-[9px] font-medium',
                  isActive && 'text-teal-600',
                  isDone   && 'text-teal-500',
                  !isDone && !isActive && 'text-slate-300',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* 연결선 */}
            {!isLast && (
              <div
                className={cn(
                  'mb-4 h-0.5 flex-1',
                  idx < currentIdx ? 'bg-teal-400' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

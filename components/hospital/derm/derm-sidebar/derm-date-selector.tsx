'use client'

import { useRouter } from 'next/navigation'
import { format, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  hosId: string
  targetDate: string
}

export default function DermDateSelector({ hosId, targetDate }: Props) {
  const router = useRouter()
  const date = new Date(targetDate)

  const go = (d: Date) => {
    router.push(`/hospital/${hosId}/derm/${format(d, 'yyyy-MM-dd')}` as any)
  }

  return (
    <div className="flex items-center justify-between gap-1 py-0.5">
      <button onClick={() => go(subDays(date, 1))} className="rounded p-1 hover:bg-slate-100">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs font-semibold text-slate-700">
        {format(date, 'M월 d일 (EEE)', { locale: ko })}
      </span>
      <button onClick={() => go(addDays(date, 1))} className="rounded p-1 hover:bg-slate-100">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

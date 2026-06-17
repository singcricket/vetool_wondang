'use client'

import { useRouter } from 'next/navigation'
import type { DermSidebarItem } from '@/lib/services/derm/fetch-derm'
import { SEVERITY_CONFIG } from '@/types/hospital/derm-type'
import { cn } from '@/lib/utils/utils'

interface Props {
  item: DermSidebarItem
  hosId: string
  targetDate: string
  isActive: boolean
}

export default function DermPatientButton({ item, hosId, targetDate, isActive }: Props) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/hospital/${hosId}/derm/${targetDate}/${item.id}` as any)}
      className={cn(
        'w-full rounded-lg px-2 py-2 text-left transition-colors',
        isActive ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-xs font-semibold">{item.patient_name}</span>
        {item.overall_severity && (
          <span className={cn(
            'shrink-0 rounded-full w-2 h-2',
            isActive ? 'bg-white/70' : SEVERITY_CONFIG[item.overall_severity]?.dot,
          )} />
        )}
      </div>
      <div className={cn('text-[10px] truncate', isActive ? 'text-emerald-100' : 'text-slate-400')}>
        {item.breed} · {item.hos_patient_id}
      </div>
      <div className={cn('text-[10px]', isActive ? 'text-emerald-200' : 'text-slate-400')}>
        {item.visit_type === 'followup' ? '재진' : '초진'}
      </div>
    </button>
  )
}

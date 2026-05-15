'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/utils'
import type { OncologyCaseProtocolRow, OncologyScheduleRow } from '@/lib/services/oncology/fetch-oncology-case'
import { CalendarDays, CheckCircle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'

const STATUS_DISPLAY: Record<string, { label: string; className: string }> = {
  scheduled: { label: '예정', className: 'bg-slate-100 text-slate-600' },
  completed: { label: '완료', className: 'bg-emerald-100 text-emerald-700' },
  delayed: { label: '연기', className: 'bg-yellow-100 text-yellow-700' },
  reduced: { label: '용량 조정', className: 'bg-orange-100 text-orange-700' },
  skipped: { label: '건너뜀', className: 'bg-red-100 text-red-700' },
}

interface OwnerTab2ScheduleProps {
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function OwnerTab2Schedule({ caseProtocols }: OwnerTab2ScheduleProps) {
  const allSchedules = caseProtocols.flatMap((cp) => cp.schedules)
  const completed = allSchedules.filter((s) => s.status === 'completed').length
  const total = allSchedules.length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // Group all schedules by cycle number across protocols
  const grouped = allSchedules.reduce<Record<number, OncologyScheduleRow[]>>((acc, s) => {
    acc[s.cycle_number] = acc[s.cycle_number] ?? []
    acc[s.cycle_number].push(s)
    return acc
  }, {})

  const cycleKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set(cycleKeys.slice(0, 1)))

  const toggleCycle = (cycle: number) => {
    setExpandedCycles((prev) => {
      const next = new Set(prev)
      if (next.has(cycle)) next.delete(cycle)
      else next.add(cycle)
      return next
    })
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <ClipboardList size={40} className="mb-3 opacity-40" />
        <p className="text-sm">등록된 항암치료 스케줄이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Completion banner */}
      <div className="rounded-xl bg-white border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">전체 치료 진행률</span>
          </div>
          <span className="text-xl font-bold text-rose-600">{completionRate}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-400 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 text-right">{completed} / {total} 회 완료</p>
      </div>

      {/* Per-cycle accordion */}
      <div className="space-y-2">
        {cycleKeys.map((cycle) => {
          const rows = grouped[cycle]
          const isExpanded = expandedCycles.has(cycle)
          const cycleCompleted = rows.filter((r) => r.status === 'completed').length
          const firstDate = rows[0]?.scheduled_date

          return (
            <div key={cycle} className="rounded-xl border bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCycle(cycle)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{cycle}번째 사이클</span>
                  {firstDate && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CalendarDays size={11} />
                      {firstDate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{cycleCompleted}/{rows.length} 완료</span>
                  {isExpanded
                    ? <ChevronUp size={15} className="text-slate-400" />
                    : <ChevronDown size={15} className="text-slate-400" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="border-t divide-y">
                  {rows.map((sched) => {
                    const disp = STATUS_DISPLAY[sched.status] ?? {
                      label: sched.status,
                      className: 'bg-slate-100 text-slate-600',
                    }
                    return (
                      <div key={sched.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-slate-400 shrink-0">{sched.scheduled_date}</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{sched.drug_name}</span>
                        </div>
                        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0', disp.className)}>
                          {disp.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

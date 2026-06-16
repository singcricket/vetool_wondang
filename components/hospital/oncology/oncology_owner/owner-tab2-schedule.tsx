'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/utils'
import type { OncologyCaseProtocolRow, OncologyScheduleRow } from '@/lib/services/oncology/fetch-oncology-case'
import { CalendarDays, ClipboardList } from 'lucide-react'

const STATUS_DISPLAY: Record<string, { label: string; className: string }> = {
  scheduled: { label: '예정', className: 'bg-slate-100 text-slate-600' },
  completed: { label: '완료', className: 'bg-emerald-100 text-emerald-700' },
  delayed: { label: '연기', className: 'bg-yellow-100 text-yellow-700' },
  reduced: { label: '용량 조정', className: 'bg-orange-100 text-orange-700' },
  skipped: { label: '건너뜀', className: 'bg-red-100 text-red-700' },
}

const CP_STATUS_CONFIG: Record<string, { label: string; badge: string; bar: string }> = {
  active:       { label: '진행 중', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  completed:    { label: '완료',    badge: 'bg-blue-100 text-blue-800',       bar: 'bg-blue-500'   },
  discontinued: { label: '중단',    badge: 'bg-red-100 text-red-800',         bar: 'bg-red-400'    },
}

interface OwnerTab2ScheduleProps {
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function OwnerTab2Schedule({ caseProtocols }: OwnerTab2ScheduleProps) {
  const totalSchedules = caseProtocols.flatMap((cp) => cp.schedules).length

  // per-protocol expanded cycles state: protocolId -> Set<cycleNumber>
  const [expandedMap, setExpandedMap] = useState<Record<string, Set<number>>>(() => {
    const init: Record<string, Set<number>> = {}
    for (const cp of caseProtocols) {
      const firstCycle = cp.schedules[0]?.cycle_number
      init[cp.id] = firstCycle !== undefined ? new Set([firstCycle]) : new Set()
    }
    return init
  })

  const toggleCycle = (protocolId: string, cycle: number) => {
    setExpandedMap((prev) => {
      const prevSet = prev[protocolId] ?? new Set<number>()
      const next = new Set(prevSet)
      if (next.has(cycle)) next.delete(cycle)
      else next.add(cycle)
      return { ...prev, [protocolId]: next }
    })
  }

  if (totalSchedules === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <ClipboardList size={40} className="mb-3 opacity-40" />
        <p className="text-sm">등록된 항암치료 스케줄이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {caseProtocols.map((cp, idx) => {
        const schedules = cp.schedules
        const cpStatus = (cp.status ?? 'active') as string
        const statusCfg = CP_STATUS_CONFIG[cpStatus] ?? CP_STATUS_CONFIG.active
        const completed = schedules.filter((s) => s.status === 'completed').length
        const total = schedules.length
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0

        // group schedules by cycle within this protocol
        const grouped = schedules.reduce<Record<number, OncologyScheduleRow[]>>((acc, s) => {
          acc[s.cycle_number] = acc[s.cycle_number] ?? []
          acc[s.cycle_number].push(s)
          return acc
        }, {})
        const cycleKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b)
        const expandedCycles = expandedMap[cp.id] ?? new Set<number>()

        return (
          <div key={cp.id} className="space-y-2">
            {/* Protocol header */}
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    프로토콜 {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800 truncate">
                    {cp.protocol?.protocol_name ?? '미지정'}
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', statusCfg.badge)}>
                    {statusCfg.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-700 shrink-0">{rate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', statusCfg.bar)}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 text-right">{completed} / {total} 회 완료</p>
            </div>

            {/* Per-cycle accordion within this protocol */}
            {cycleKeys.length > 0 && (
              <div className="space-y-2 pl-2">
                {cycleKeys.map((cycle) => {
                  const rows = grouped[cycle]
                  const isExpanded = expandedCycles.has(cycle)
                  const cycleCompleted = rows.filter((r) => r.status === 'completed').length
                  const firstDate = rows[0]?.scheduled_date

                  return (
                    <div key={cycle} className="rounded-xl border bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCycle(cp.id, cycle)}
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
                          <span className="text-slate-400">
                            {isExpanded ? '▲' : '▼'}
                          </span>
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
            )}
          </div>
        )
      })}
    </div>
  )
}

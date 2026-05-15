'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/utils'
import { updateScheduleStatus } from '@/lib/actions/oncology/schedule-actions'
import type { OncologyCaseProtocolRow, OncologyScheduleRow } from '@/lib/services/oncology/fetch-oncology-case'
import { CheckCircle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'scheduled', label: '미실시', className: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  { value: 'completed', label: '완료', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { value: 'delayed', label: '연기', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { value: 'reduced', label: '감량', className: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { value: 'skipped', label: '건너뜀', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
]

function ScheduleRow({
  schedule,
  onUpdate,
}: {
  schedule: OncologyScheduleRow
  onUpdate: () => void
}) {
  const [activeStatus, setActiveStatus] = useState(schedule.status)
  const [showForm, setShowForm] = useState(false)
  const [bodyWeight, setBodyWeight] = useState(schedule.body_weight_at_visit?.toString() ?? '')
  const [doseActual, setDoseActual] = useState(schedule.dose_actual?.toString() ?? '')
  const [notes, setNotes] = useState(schedule.notes ?? '')
  const [delayReason, setDelayReason] = useState(schedule.delay_reason ?? '')
  const [reductionReason, setReductionReason] = useState(schedule.reduction_reason ?? '')
  const [saving, setSaving] = useState(false)

  const handleStatusClick = (status: string) => {
    if (status === 'completed' || status === 'reduced') {
      setActiveStatus(status)
      setShowForm(true)
    } else {
      handleSave(status)
    }
  }

  const handleSave = async (status?: string) => {
    setSaving(true)
    const s = status ?? activeStatus
    try {
      await updateScheduleStatus(schedule.id, s, {
        dose_actual: doseActual ? parseFloat(doseActual) : null,
        body_weight_at_visit: bodyWeight ? parseFloat(bodyWeight) : null,
        notes: notes || null,
        delay_reason: delayReason || null,
        reduction_reason: reductionReason || null,
      })
      toast.success('업데이트되었습니다.')
      setShowForm(false)
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업데이트 실패')
    } finally {
      setSaving(false)
    }
  }

  const currentStatusStyle = STATUS_OPTIONS.find((o) => o.value === (showForm ? activeStatus : schedule.status))

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 w-22 shrink-0">{schedule.scheduled_date}</span>
        <span className="text-sm font-medium text-slate-800 flex-1 min-w-[100px]">{schedule.drug_name}</span>
        <span className="text-xs text-slate-400 uppercase">{schedule.drug_route}</span>
        <span className="text-xs text-slate-600">
          {schedule.dose_calculated != null ? `${schedule.dose_calculated} ${schedule.dose_unit}` : '—'}
        </span>

        {/* Status buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusClick(opt.value)}
              disabled={saving}
              className={cn(
                'px-2 py-0.5 rounded text-xs transition-colors',
                opt.className,
                schedule.status === opt.value && 'ring-2 ring-offset-1 ring-rose-400',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detail form for completed/reduced */}
      {showForm && (
        <div className="px-3 pb-3 pt-1 bg-slate-50 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1">방문 시 체중 (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                className="h-7 text-xs"
                placeholder="0.0"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1">실제 투여량 ({schedule.dose_unit})</Label>
              <Input
                type="number"
                step="0.01"
                value={doseActual}
                onChange={(e) => setDoseActual(e.target.value)}
                className="h-7 text-xs"
                placeholder={schedule.dose_calculated?.toString() ?? '0.0'}
              />
            </div>
          </div>
          {activeStatus === 'delayed' && (
            <div>
              <Label className="text-xs text-slate-600 mb-1">연기 사유</Label>
              <Input
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
          {activeStatus === 'reduced' && (
            <div>
              <Label className="text-xs text-slate-600 mb-1">감량 사유</Label>
              <Input
                value={reductionReason}
                onChange={(e) => setReductionReason(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
          <div>
            <Label className="text-xs text-slate-600 mb-1">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-14 text-xs resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <CheckCircle size={12} className="mr-1" />
              저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="h-7 text-xs"
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface Tab3DosingProps {
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function Tab3Dosing({ caseProtocols }: Tab3DosingProps) {
  const router = useRouter()
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(
    new Set(caseProtocols.map((cp) => cp.id))
  )

  const allSchedules = caseProtocols.flatMap((cp) => cp.schedules)
  const completed = allSchedules.filter((s) => s.status === 'completed').length
  const total = allSchedules.length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const toggleProtocol = (id: string) => {
    setExpandedProtocols((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (caseProtocols.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <ClipboardList size={40} className="mb-3 opacity-40" />
        <p className="text-sm">등록된 스케줄이 없습니다.</p>
        <p className="text-xs mt-1">프로토콜 탭에서 프로토콜을 먼저 추가하세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Completion rate banner */}
      <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3 border">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600">전체 투약 완료율</span>
            <span className="text-sm font-semibold text-rose-700">{completionRate}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-slate-500 text-right shrink-0">
          <div>{completed} / {total} 회</div>
        </div>
      </div>

      {/* Per-protocol sections */}
      {caseProtocols.map((cp) => {
        const grouped = cp.schedules.reduce<Record<number, OncologyScheduleRow[]>>((acc, s) => {
          acc[s.cycle_number] = acc[s.cycle_number] ?? []
          acc[s.cycle_number].push(s)
          return acc
        }, {})

        return (
          <div key={cp.id} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleProtocol(cp.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 hover:bg-rose-100 transition-colors text-left"
            >
              <span className="font-semibold text-rose-800">{cp.protocol.protocol_name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {cp.completed_doses}/{cp.total_doses} 완료
                </span>
                {expandedProtocols.has(cp.id)
                  ? <ChevronUp size={16} className="text-rose-600" />
                  : <ChevronDown size={16} className="text-rose-600" />
                }
              </div>
            </button>

            {expandedProtocols.has(cp.id) && (
              <div className="p-3 space-y-4">
                {Object.entries(grouped).map(([cycle, rows]) => (
                  <div key={cycle}>
                    <div className="text-xs font-semibold text-slate-500 mb-2">사이클 {cycle}</div>
                    <div className="space-y-2">
                      {rows.map((sched) => (
                        <ScheduleRow
                          key={sched.id}
                          schedule={sched}
                          onUpdate={() => router.refresh()}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

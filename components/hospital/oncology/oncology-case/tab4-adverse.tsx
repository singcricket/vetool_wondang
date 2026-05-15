'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { deleteAdverseEvent } from '@/lib/actions/oncology/adverse-event-actions'
import type { OncologyAdverseEventRow, OncologyCaseProtocolRow } from '@/lib/services/oncology/fetch-oncology-case'
import AdverseEventDialog from './adverse-event-dialog'
import { AlertTriangle, CheckCircle, Loader2, Pencil, PlusCircle, Stethoscope, Trash2, User } from 'lucide-react'

const VCOG_GRADE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'G1 경미', color: 'bg-green-100 text-green-800' },
  2: { label: 'G2 중등도', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'G3 중증', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'G4 생명위협', color: 'bg-red-100 text-red-800' },
  5: { label: 'G5 사망', color: 'bg-red-900 text-white' },
}

interface Tab4AdverseProps {
  caseId: string
  adverseEvents: OncologyAdverseEventRow[]
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function Tab4Adverse({ caseId, adverseEvents, caseProtocols }: Tab4AdverseProps) {
  const router = useRouter()
  const [localEvents, setLocalEvents] = useState<OncologyAdverseEventRow[]>(adverseEvents)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleSaved = (event: OncologyAdverseEventRow) => {
    setLocalEvents((prev) => [event, ...prev])
  }

  const handleUpdated = (event: OncologyAdverseEventRow) => {
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      await deleteAdverseEvent(id)
      toast.success('삭제되었습니다.')
      setLocalEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600" />
          부작용 기록 ({localEvents.length}건)
        </h3>
        <AdverseEventDialog
          caseId={caseId}
          caseProtocols={caseProtocols}
          onSaved={handleSaved}
          trigger={
            <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50">
              <PlusCircle size={14} className="mr-1" />
              부작용 기록 추가
            </Button>
          }
        />
      </div>

      {/* Events list */}
      {localEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <CheckCircle size={40} className="mb-3 opacity-40" />
          <p className="text-sm">기록된 부작용이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localEvents.map((ae) => {
            const gradeInfo = VCOG_GRADE_LABELS[ae.vcog_grade] ?? { label: `G${ae.vcog_grade}`, color: 'bg-slate-100 text-slate-700' }
            return (
              <div key={ae.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">{ae.event_date}</span>
                      <span className="font-semibold text-slate-800 text-sm">{ae.event_type}</span>
                      {ae.drug_name && (
                        <span className="text-xs text-slate-500">({ae.drug_name})</span>
                      )}
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', gradeInfo.color)}>
                        {gradeInfo.label}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                        ae.reported_by === 'vet'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700',
                      )}>
                        {ae.reported_by === 'vet'
                          ? <><Stethoscope size={10} /> 수의사</>
                          : <><User size={10} /> 보호자</>
                        }
                      </span>
                      {ae.resolved && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          해결됨 {ae.resolved_date && `(${ae.resolved_date})`}
                        </span>
                      )}
                    </div>
                    {ae.description && (
                      <p className="text-sm text-slate-600">{ae.description}</p>
                    )}
                    {ae.action_taken && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded p-2">
                        <span className="font-medium">조치:</span> {ae.action_taken}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <AdverseEventDialog
                      caseId={caseId}
                      caseProtocols={caseProtocols}
                      initialData={ae}
                      onUpdated={handleUpdated}
                      trigger={
                        <button type="button" className="text-slate-400 hover:text-blue-500 transition-colors">
                          <Pencil size={13} />
                        </button>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(ae.id)}
                      disabled={deleting === ae.id}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      {deleting === ae.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

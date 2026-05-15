'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import type { OncologyAdverseEventRow } from '@/lib/services/oncology/fetch-oncology-case'
import OwnerAdverseCreateDialog from './owner-adverse-create-dialog'
import { AlertCircle, CheckCircle, PlusCircle, Stethoscope, User } from 'lucide-react'

interface OwnerTab3AdverseProps {
  caseId: string
  adverseEvents: OncologyAdverseEventRow[]
  readOnly?: boolean
  usePublicAction?: boolean
}

export default function OwnerTab3Adverse({ caseId, adverseEvents, readOnly = false, usePublicAction = false }: OwnerTab3AdverseProps) {
  const [localEvents, setLocalEvents] = useState<OncologyAdverseEventRow[]>(adverseEvents)
  const [createOpen, setCreateOpen] = useState(false)

  const handleSaved = (row: OncologyAdverseEventRow) => {
    setLocalEvents((prev) => [row, ...prev])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-500" />
          증상 기록 ({localEvents.length}건)
        </h3>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            <PlusCircle size={13} className="mr-1.5" />
            증상 추가
          </Button>
        )}
      </div>

      {localEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <CheckCircle size={40} className="mb-3 opacity-40" />
          <p className="text-sm">기록된 증상이 없습니다.</p>
          <p className="text-xs mt-1">집에서 관찰되는 증상을 기록해주세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localEvents.map((ae) => (
            <div key={ae.id} className="rounded-xl border bg-white p-4 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">{ae.event_date}</span>
                <span className="text-sm font-semibold text-slate-800">{ae.event_type}</span>
                <span className={cn(
                  'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                  ae.reported_by === 'vet'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700',
                )}>
                  {ae.reported_by === 'vet'
                    ? <><Stethoscope size={10} /> 수의사 기록</>
                    : <><User size={10} /> 보호자 기록</>
                  }
                </span>
                {ae.resolved && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    호전됨{ae.resolved_date && ` (${ae.resolved_date})`}
                  </span>
                )}
              </div>
              {ae.description && (
                <p className="text-sm text-slate-700 leading-relaxed">{ae.description}</p>
              )}
              {ae.action_taken && (
                <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-600">
                  <span className="text-xs font-semibold text-slate-500 block mb-0.5">조치사항</span>
                  {ae.action_taken}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <OwnerAdverseCreateDialog
          caseId={caseId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSaved={handleSaved}
          usePublicAction={usePublicAction}
        />
      )}
    </div>
  )
}

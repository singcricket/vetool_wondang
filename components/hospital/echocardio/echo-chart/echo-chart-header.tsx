'use client'

import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns'
import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'

interface EchoChartHeaderProps {
  chartDetail: EchoChartDetail
  isSaving: boolean
  onSave: () => void
}

function getAge(birth: string) {
  const now = new Date()
  const birthDate = parseISO(birth)
  const years = differenceInYears(now, birthDate)
  if (years > 0) return `${years}세`
  const months = differenceInMonths(now, birthDate)
  return `${months}개월`
}

export default function EchoChartHeader({
  chartDetail,
  isSaving,
  onSave,
}: EchoChartHeaderProps) {
  const { patient, vet, examiner, exam_date } = chartDetail

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-2">
      {/* 환자 정보 */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold">{patient.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {patient.hos_patient_id}
          </span>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{patient.species}</span>
          <span>·</span>
          <span>{patient.breed}</span>
          <span>·</span>
          <span>{getAge(patient.birth)}</span>
          <span>·</span>
          <span>{patient.gender}</span>
        </div>
      </div>

      {/* 검사 정보 */}
      <div className="flex items-center gap-3">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            {format(parseISO(exam_date), 'yyyy.MM.dd')}
          </span>
          {vet && <span>담: {vet.name}</span>}
          {examiner && <span>검: {examiner.name}</span>}
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

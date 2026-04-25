'use client'

import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalToothForm from '../dental-tooth-detail/dental-tooth-form'

type Props = {
  selectedToothId: string | null
  selectedToothIds?: string[]
  chartDetail: DentalChartDetail
  hosId: string
  teeth: DentalTooth[]
}

export default function DentalToothTab({ selectedToothId, selectedToothIds = [], chartDetail, hosId, teeth }: Props) {
  const effectiveId = selectedToothId || (selectedToothIds.length === 1 ? selectedToothIds[0] : null)
  const effectiveIds = selectedToothIds.length > 0 ? selectedToothIds : (effectiveId ? [effectiveId] : [])

  if (effectiveIds.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <span className="text-3xl">🦷</span>
        </div>
        <p className="text-sm font-medium text-foreground">치아를 선택하세요</p>
        <p className="text-xs text-muted-foreground">
          위의 치아 차트에서 치아를 클릭하면<br />상세 정보를 입력할 수 있습니다
        </p>
      </div>
    )
  }

  const existing = teeth.find((t) => String(t.tooth_id) === effectiveId)

  return (
    <DentalToothForm
      toothIds={effectiveIds}
      chartDetail={chartDetail}
      hosId={hosId}
      existing={existing}
    />
  )
}

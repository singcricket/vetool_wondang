'use client'

import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalToothForm from '../dental-tooth-detail/dental-tooth-form'

type Props = {
  selectedToothId: string | null
  chartDetail: DentalChartDetail
  hosId: string
  teeth: DentalTooth[]
}

export default function DentalToothTab({ selectedToothId, chartDetail, hosId, teeth }: Props) {
  if (!selectedToothId) {
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

  const existing = teeth.find((t) => String(t.tooth_id) === selectedToothId)

  return (
    <DentalToothForm
      toothId={selectedToothId}
      chartDetail={chartDetail}
      hosId={hosId}
      existing={existing}
    />
  )
}

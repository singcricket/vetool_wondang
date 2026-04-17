'use client'

import DentalChartSvgPanel from './dental-chart-svg-panel'
import type { DentalTooth } from '@/types/dental/dental-type'

interface Props {
  species: string
  selectedToothId: string | null
  onToothClick: (id: string) => void
  teeth: DentalTooth[]
}

export default function DentalChartDetailPanel({
  species,
  selectedToothId,
  onToothClick,
  teeth,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="shrink-0 border-b bg-slate-50 px-4 py-2">
        <p className="text-xs font-semibold text-muted-foreground">
          치아 차트 — 치아를 클릭하여 상세 정보를 입력하거나 확인하세요.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-2 flex justify-center items-start">
        <div className="w-full">
          <DentalChartSvgPanel
            species={species}
            selectedToothId={selectedToothId}
            onToothClick={onToothClick}
            teeth={teeth}
          />
        </div>
      </div>
    </div>
  )
}

'use client'

import { DentalChartCanineCombined } from '@/constants/hospital/dental/dental_chart_canine_combined'
import { DentalChartFelineCombined } from '@/constants/hospital/dental/dental_chart_feline_combined'
import type { DentalTooth } from '@/types/dental/dental-type'

type Props = {
  species: string
  selectedToothId: string | null
  selectedToothIds?: string[]
  onToothClick: (id: string, e?: React.MouseEvent) => void
  teeth: DentalTooth[]
}

function getRecordedToothIds(teeth: DentalTooth[]): Set<string> {
  return new Set(
    teeth
      .filter(
        (t) =>
          t.status !== 'present' ||
          t. gingivitis ||
          t.calculus ||
          t.fracture ||
          t.tooth_note,
      )
      .map((t) => String(t.tooth_id)),
  )
}

export default function DentalChartSvgPanel({
  species,
  selectedToothId,
  selectedToothIds,
  onToothClick,
  teeth,
}: Props) {
  const recordedIds = getRecordedToothIds(teeth)
  const isFeline = species?.toLowerCase().startsWith('fel')

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {isFeline ? (
          <DentalChartFelineCombined
            selectedToothId={selectedToothId}
            selectedToothIds={selectedToothIds}
            onToothClick={onToothClick}
            teeth={teeth}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        ) : (
          <DentalChartCanineCombined
            selectedToothId={selectedToothId}
            selectedToothIds={selectedToothIds}
            onToothClick={onToothClick}
            teeth={teeth}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )}
      </div>

      {/* 기록된 치아 배지 */}
      {/* {recordedIds.size > 0 && (
        <div className="shrink-0 flex flex-wrap gap-1 border-t bg-slate-50 px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground self-center">기록:</span>
          {Array.from(recordedIds)
            .sort()
            .map((id) => (
              <button
                key={id}
                onClick={() => onToothClick(id)}
                className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-200"
              >
                {id}
              </button>
            ))}
        </div>
      )} */}
    </div>
  )
}

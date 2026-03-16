'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VitalResults } from "@/types/monitoring/monitoring-type"
import { Trash2 } from "lucide-react"
import { SelectedSlotMode } from "./ms-mobile-cl-table"

type Props = {
  selectedSlotIndex: SelectedSlotMode
  vitalResults: VitalResults
  selectedClNames: string[]
  isAddMode: boolean
  newVitalValues: Record<string, string>
  setNewVitalValues: (val: Record<string, string>) => void
  onVitalChange: (vitalName: string, value: string) => void
  onMinTimeChange: (newMinTime: string) => void
  onDeleteSlot: () => void
  isSaving: boolean
}

export default function MsMobileClInputTable({
  selectedSlotIndex,
  vitalResults,
  selectedClNames,
  isAddMode,
  newVitalValues,
  setNewVitalValues,
  onVitalChange,
  onMinTimeChange,
  onDeleteSlot,
  isSaving,
}: Props) {
  const currentSlot = selectedSlotIndex !== null ? vitalResults[selectedSlotIndex] : null

  // 표시할 항목 목록
  const vitalsToShow = selectedClNames

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0">
      {/* 헤더: 항목명 / 값 */}
      <div className="flex items-center border-b pb-1">
        <div className="w-28 shrink-0 px-2 text-xs font-semibold text-muted-foreground">측정 항목</div>
        <div className="flex flex-1 items-center justify-between px-2">
          <span className="text-xs font-semibold text-muted-foreground">값</span>
          {/* 삭제 버튼 (수정 모드에서만) */}
          {!isAddMode && currentSlot && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onDeleteSlot}
              disabled={isSaving}
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* 선택된 슬롯이 없으면 안내 문구 */}
      {!isAddMode && !currentSlot && (
        <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
          왼쪽에서 시간대를 선택하세요
        </div>
      )}

      {/* 항목 + 값 입력 행 목록 */}
      {(isAddMode || currentSlot) && vitalsToShow.map((vitalName) => {
        const existingEntry = currentSlot?.vitals.find(v => v.vitalName === vitalName)
        const value = isAddMode
          ? (newVitalValues[vitalName] ?? '')
          : (existingEntry?.value ?? '')

        return (
          <div key={vitalName} className="flex items-center border-b last:border-b-0">
            {/* 항목명 */}
            <div className="w-28 shrink-0 px-2 py-1 text-xs text-foreground">
              {vitalName}
            </div>
            {/* 값 입력 */}
            <div className="flex-1 px-1">
              <Input
                className="h-8 rounded-none border-none bg-transparent px-1 text-xs ring-inset focus-visible:ring-1"
                value={value}
                onChange={(e) => {
                  if (isAddMode) {
                    setNewVitalValues({ ...newVitalValues, [vitalName]: e.target.value })
                  } else {
                    onVitalChange(vitalName, e.target.value)
                  }
                }}
                disabled={isSaving}
              />
            </div>
          </div>
        )
      })}

      {/* 저장 중 표시 */}
      {isSaving && (
        <div className="mt-1 px-2 text-right text-[10px] text-muted-foreground">
          저장 중...
        </div>
      )}
    </div>
  )
}
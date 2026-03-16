'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VitalResults } from "@/types/monitoring/monitoring-type"
import { PlusIcon } from "lucide-react"
import { SelectedSlotMode } from "./ms-mobile-cl-table"
import { useEffect } from "react"

type Props = {
  vitalResults: VitalResults
  selectedSlotIndex: SelectedSlotMode
  setSelectedSlotIndex: (index: SelectedSlotMode) => void
  startTime: string | null
  intervalSetting: number | null
  newMinTime: string
  setNewMinTime: (val: string) => void
  onAddSlot: () => void
  isSaving: boolean
}

export default function MsMobileClTimeSelect({
  vitalResults,
  selectedSlotIndex,
  setSelectedSlotIndex,
  startTime,
  intervalSetting,
  newMinTime,
  setNewMinTime,
  onAddSlot,
  isSaving,
}: Props) {

  // 자동 시간 계산 (데스크탑 MsClMinTimeInput과 동일한 로직)
  useEffect(() => {
    if (!startTime) return

    const calculateElapsed = () => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      const actualDiffMinutes = Math.floor((now - start) / (1000 * 60))
      let displayMinutes = actualDiffMinutes
      if (intervalSetting && intervalSetting >= 1) {
        displayMinutes = Math.floor(actualDiffMinutes / intervalSetting) * intervalSetting
      }
      const finalValue = displayMinutes < 0 ? "0" : displayMinutes.toString()
      if (newMinTime === '') setNewMinTime(finalValue)
    }

    if (newMinTime === '') calculateElapsed()

    const intervalMs = intervalSetting && intervalSetting >= 1 ? intervalSetting * 60000 : 60000
    const timer = setInterval(calculateElapsed, intervalMs)
    return () => clearInterval(timer)
  }, [startTime, intervalSetting, newMinTime, setNewMinTime])

  // 시간 표시 포맷: 시작 시간 + 분 -> HH:MM 형태
  const formatTime = (minTime: string) => {
    if (!startTime) return `${minTime}분`
    const absTime = new Date(new Date(startTime).getTime() + Number(minTime) * 60000)
      .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return `${minTime}분\n(${absTime})`
  }

  return (
    <div className="flex w-28 shrink-0 flex-col gap-1 border-r pr-1">
      {/* 항상 노출되는 시간 입력 + 추가 버튼 */}
      <div className="flex flex-col gap-1 border-b pb-2">
        <Input
          className="h-8 text-center text-xs"
          placeholder="분(min)"
          value={newMinTime}
          onChange={(e) => setNewMinTime(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAddSlot()
            }
          }}
          disabled={isSaving}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-full gap-1 border-primary text-xs text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => {
            setSelectedSlotIndex(null)
            onAddSlot()
          }}
          disabled={isSaving || !newMinTime}
        >
          <PlusIcon size={12} />
          추가
        </Button>
      </div>

      {/* 기존 시간대 버튼 목록 - 6개 초과 시 스크롤 */}
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {[...vitalResults]
          .sort((a, b) => Number(a.minTime) - Number(b.minTime))
          .map((slot, idx) => {
            // 정렬된 인덱스를 원래 vitalResults에서 찾아야 함
            const originalIdx = vitalResults.findIndex(
              (s) => s.create_timestamp === slot.create_timestamp
            )
            const isSelected = selectedSlotIndex === originalIdx
            return (
              <Button
                key={slot.create_timestamp}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="h-auto w-full whitespace-pre-line py-1 text-xs leading-tight"
                onClick={() => setSelectedSlotIndex(originalIdx)}
              >
                {formatTime(slot.minTime)}
              </Button>
            )
          })}
      </div>
    </div>
  )
}
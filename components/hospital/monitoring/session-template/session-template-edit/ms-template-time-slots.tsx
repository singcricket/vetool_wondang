'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { VitalEntry, VitalResults } from '@/types/monitoring/monitoring-type'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  vitalResults: VitalResults
  setVitalResults: Dispatch<SetStateAction<VitalResults>>
  plannedVitals: string[]
}

export default function MsTemplateTimeSlots({
  plannedVitals,
  vitalResults,
  setVitalResults,
}: Props) {
  const [minTimeInput, setMinTimeInput] = useState('')

  const handleAddTimeSlot = () => {
    const min = parseInt(minTimeInput)
    if (isNaN(min) || min < 0) {
      toast.error('올바른 분(min)을 입력해주세요')
      return
    }
    if (vitalResults.some((r) => r.minTime === String(min))) {
      toast.warning('동일한 측정 시간이 이미 있습니다')
      return
    }
    const prevital : VitalEntry[] = []
    plannedVitals ? plannedVitals.map((vital) => {
      prevital.push( {
        vitalName: vital,
        value: '',
      })
    }) : []

    setVitalResults((prev) => [
      ...prev,
      {
        minTime: String(min),
        vitals: prevital,
        create_timestamp: new Date().toISOString(),
      },
    ])
    console.log(plannedVitals, vitalResults)
    setMinTimeInput('')
  }

  const handleDeleteTimeSlot = (minTime: string) =>
    setVitalResults((prev) => prev.filter((r) => r.minTime !== minTime))

  const sorted = [...vitalResults].sort(
    (a, b) => Number(a.minTime) - Number(b.minTime),
  )

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        측정 시간 추가 ({vitalResults.length})
      </h3>

      <div className="rounded-md border">
        {/* 헤더 */}
        <div className="grid grid-cols-[80px_1fr_48px] border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>경과 (분)</span>
          <span>측정 항목</span>
          <span />
        </div>

        <ScrollArea className="h-40">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              선택 시간 없음
            </p>
          ) : (
            sorted.map((slot) => (
              <div
                key={slot.minTime}
                className="grid grid-cols-[80px_1fr_48px] items-center border-b px-3 py-2 text-sm last:border-b-0"
              >
                <span className="font-mono font-semibold">{slot.minTime}분</span>
                <span className="text-xs text-muted-foreground">
                  {slot.vitals?.length > 0
                    ? slot.vitals.map((v) => v.vitalName).join(', ')
                    : '측정항목 (값 없음)'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteTimeSlot(slot.minTime)}
                  type="button"
                >
                  <Trash2Icon size={13} />
                </Button>
              </div>
            ))
          )}
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* 슬롯 추가 */}
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <Input
            type="number"
            placeholder="분 입력"
            value={minTimeInput}
            onChange={(e) => setMinTimeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTimeSlot()}
            className="h-8 w-28 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button size="sm" variant="outline" onClick={handleAddTimeSlot} type="button">
            <PlusIcon size={14} className="mr-1" />
            시간 추가
          </Button>
        </div>
      </div>
    </section>
  )
}

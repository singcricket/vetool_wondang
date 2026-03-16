'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { updateMsVitalResults } from "@/lib/services/monitoring/update-ms"
import { VITAL_REFERENCE_DATA, VitalResults, VitalTimeSlot } from "@/types/monitoring/monitoring-type"
import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { toast } from "sonner"
import MsMobileClTimeSelect from "./ms-mobile-cl-timeselect"
import MsMobileClInputTable from "./ms-mobile-cl-input-table"
import { useRouter } from "next/navigation"

type Props = {
  msData: MsWithPatientWithWeight
}

// null = 신규 추가 모드, number = 기존 슬롯 수정 모드
export type SelectedSlotMode = null | number

export default function MsMobileClTable({ msData }: Props) {
  const { refresh } = useRouter()
  const clNames = VITAL_REFERENCE_DATA.map((db) => db.vitalName)
  const selectedClNames = msData.planned_vitals && msData.planned_vitals.length > 0
    ? msData.planned_vitals
    : clNames.slice(0, 4)

  const [vitalResults, setVitalResults] = useState<VitalResults>(msData.vital_results ?? [])
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<SelectedSlotMode>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 신규 추가 모드용 state
  const [newMinTime, setNewMinTime] = useState('')
  const [newVitalValues, setNewVitalValues] = useState<Record<string, string>>({})

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vitalResultsRef = useRef<VitalResults>(vitalResults)

  useEffect(() => {
    setVitalResults(msData.vital_results ?? [])
  }, [msData.vital_results])

  useEffect(() => {
    vitalResultsRef.current = vitalResults
  }, [vitalResults])

  // 3초 디바운스 저장
  const scheduleSave = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setIsSaving(true)
      const success = await updateMsVitalResults(msData.session_id, vitalResultsRef.current)
      if (!success) toast.error('저장 중 오류가 발생했습니다.')
      setIsSaving(false)
    }, 3000)
  }, [msData.session_id])

  // 기존 슬롯 바이탈 값 변경
  const handleVitalChange = useCallback((slotIndex: number, vitalName: string, newValue: string) => {
    setVitalResults(prev => {
      const updated = prev.map((slot, idx) => {
        if (idx !== slotIndex) return slot
        const hasEntry = slot.vitals.some(v => v.vitalName === vitalName)
        const updatedVitals = hasEntry
          ? slot.vitals.map(v => v.vitalName === vitalName ? { ...v, value: newValue } : v)
          : [...slot.vitals, { vitalName, value: newValue }]
        return { ...slot, vitals: updatedVitals }
      })
      return updated
    })
    scheduleSave()
  }, [scheduleSave])

  // 기존 슬롯 시간 변경
  const handleMinTimeChange = useCallback((slotIndex: number, newMinTimeVal: string) => {
    setVitalResults(prev =>
      prev.map((slot, idx) => idx === slotIndex ? { ...slot, minTime: newMinTimeVal } : slot)
    )
    scheduleSave()
  }, [scheduleSave])

  // 기존 슬롯 삭제
  const handleDeleteSlot = useCallback(async (slotIndex: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    const updated = vitalResultsRef.current.filter((_, idx) => idx !== slotIndex)
    setVitalResults(updated)
    setSelectedSlotIndex(null)
    setIsSaving(true)
    const success = await updateMsVitalResults(msData.session_id, updated)
    if (success) toast.success('삭제 완료')
    else toast.error('삭제 중 오류가 발생했습니다.')
    setIsSaving(false)
  }, [msData.session_id])

  // 신규 슬롯 추가
  const handleAddSlot = useCallback(async () => {
    if (!newMinTime) return

    const isDuplicate = vitalResults.some(slot => slot.minTime === newMinTime)
    if (isDuplicate) {
      toast.warning('동일한 시간의 기록이 있습니다')
      return
    }

    const newSlot: VitalTimeSlot = {
      create_timestamp: new Date().toISOString(),
      minTime: newMinTime,
      vitals: selectedClNames.map(vitalName => ({
        vitalName,
        value: newVitalValues[vitalName] || ''
      }))
    }

    const updatedResults = [...vitalResults, newSlot]
    setIsSaving(true)
    const success = await updateMsVitalResults(msData.session_id, updatedResults)
    if (success) {
      setVitalResults(updatedResults)
      setNewMinTime('')
      setNewVitalValues({})
      setSelectedSlotIndex(updatedResults.length - 1)
      toast.success('새 측정 시간이 추가되었습니다')
      refresh()
    } else {
      toast.error('추가 중 오류가 발생했습니다.')
    }
    setIsSaving(false)
  }, [newMinTime, newVitalValues, vitalResults, msData.session_id, selectedClNames, refresh])

  return (
    <div className="flex w-full">
      {/* 컬럼1: 시간대 버튼 목록 */}
      <MsMobileClTimeSelect
        vitalResults={vitalResults}
        selectedSlotIndex={selectedSlotIndex}
        setSelectedSlotIndex={setSelectedSlotIndex}
        startTime={msData.start_time}
        intervalSetting={msData.interval_setting}
        newMinTime={newMinTime}
        setNewMinTime={setNewMinTime}
        onAddSlot={handleAddSlot}
        isSaving={isSaving}
      />

      {/* 컬럼2+3: 항목명 + 값 입력 */}
      <MsMobileClInputTable
        selectedSlotIndex={selectedSlotIndex}
        vitalResults={vitalResults}
        selectedClNames={selectedClNames}
        isAddMode={selectedSlotIndex === null}
        newVitalValues={newVitalValues}
        setNewVitalValues={setNewVitalValues}
        onVitalChange={(vitalName, value) => {
          if (selectedSlotIndex !== null) {
            handleVitalChange(selectedSlotIndex, vitalName, value)
          }
        }}
        onMinTimeChange={(newMinTimeVal) => {
          if (selectedSlotIndex !== null) {
            handleMinTimeChange(selectedSlotIndex, newMinTimeVal)
          }
        }}
        onDeleteSlot={() => {
          if (selectedSlotIndex !== null) {
            handleDeleteSlot(selectedSlotIndex)
          }
        }}
        isSaving={isSaving}
      />
    </div>
  )
}
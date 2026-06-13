'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { TableBody } from '@/components/ui/table'
import { VITAL_REFERENCE_DATA, VitalResults } from "@/types/monitoring/monitoring-type"
import MsClTableCreateRow from "./ms-cl-table-create-row"
import MsClTableResultRow from "./ms-cl-table-result-row"
import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { updateMsVitalResults } from "@/lib/services/monitoring/update-ms"
import { toast } from "sonner"
import type { VitalTimeSlot } from "@/types/monitoring/monitoring-type"

export type MsClTableBodyHandle = {
  insertRow: (slot: VitalTimeSlot) => void
}

type Props = {
    msData: MsWithPatientWithWeight
}

const MsClTableBody = forwardRef<MsClTableBodyHandle, Props>(function MsClTableBody({ msData }, ref) {
    const clNames: string[] = VITAL_REFERENCE_DATA.map((db) => db.vitalName)

    const [vitalResults, setVitalResults] = useState<VitalResults>(msData.vital_results ?? [])
    const [isSaving, setIsSaving] = useState(false)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    // 최신 vitalResults를 항상 참조할 수 있도록 ref에 동기화
    const vitalResultsRef = useRef<VitalResults>(vitalResults)

    // msData가 외부에서 바뀌면 state도 동기화
    useEffect(() => {
        setVitalResults(msData.vital_results ?? [])
    }, [msData.vital_results])

    // state 변경 시 ref 동기화
    useEffect(() => {
        vitalResultsRef.current = vitalResults
    }, [vitalResults])

    // 언마운트 시 혹은 세션 아이디 변경 시 대기 중인 저장 작업이 있다면 즉시 실행
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
                updateMsVitalResults(msData.session_id, vitalResultsRef.current)
            }
        }
    }, [msData.session_id])

    // 2초 디바운스 후 DB 저장
    const scheduleSave = useCallback(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(async () => {
            setIsSaving(true)
            const success = await updateMsVitalResults(msData.session_id, vitalResultsRef.current)
            if (!success) {
                toast.error('저장 중 오류가 발생했습니다.')
            }
            setIsSaving(false)
        }, 3000)
    }, [msData.session_id])

    // Vital 값 변경 콜백
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

    // 시간(minTime) 변경 콜백
    const handleMinTimeChange = useCallback((slotIndex: number, newMinTime: string) => {
        setVitalResults(prev => {
            const updated = prev.map((slot, idx) =>
                idx === slotIndex ? { ...slot, minTime: newMinTime } : slot
            )
            return updated
        })
        scheduleSave()
    }, [scheduleSave])

    // 스캔 결과 행 삽입 — 외부에서 호출 (useImperativeHandle)
    const insertRow = useCallback((slot: VitalTimeSlot) => {
        setVitalResults(prev => {
            const updated = [slot, ...prev]
            vitalResultsRef.current = updated
            return updated
        })
        scheduleSave()
    }, [scheduleSave])

    useImperativeHandle(ref, () => ({ insertRow }), [insertRow])

    // 삭제 콜백 — 즉시 DB 반영
    const handleDeleteSlot = useCallback(async (slotIndex: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        const updated = vitalResultsRef.current.filter((_, idx) => idx !== slotIndex)
        setVitalResults(updated)
        setIsSaving(true)
        const success = await updateMsVitalResults(msData.session_id, updated)
        if (success) {
            toast.success('삭제 완료')
        } else {
            toast.error('삭제 중 오류가 발생했습니다.')
        }
        setIsSaving(false)
    }, [msData.session_id])

    return (
        <TableBody>
            {vitalResults.map((timeSlot, index) => (
                <MsClTableResultRow
                    key={timeSlot.create_timestamp + index}
                    timeSlot={timeSlot}
                    selectedVital={msData.planned_vitals}
                    clNames={clNames}
                    startTime={msData.start_time}
                    isUpdating={isSaving}
                    species={msData.patient?.species as 'canine' | 'feline' | null ?? null}
                    onVitalChange={(vitalName, value) => handleVitalChange(index, vitalName, value)}
                    onMinTimeChange={(newMinTime) => handleMinTimeChange(index, newMinTime)}
                    onDeleteRow={() => handleDeleteSlot(index)}
                />
            ))}
            <MsClTableCreateRow
                sessionId={msData.session_id}
                selectedVital={msData.planned_vitals}
                vitalData={vitalResults}
                clNames={clNames}
                startTime={msData.start_time}
                intervalSetting={msData.interval_setting}
            />
        </TableBody>
    )
})

export default MsClTableBody
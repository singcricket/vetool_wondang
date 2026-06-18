'use client'

import { useRef, useState } from 'react'
import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import MsClHeader from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-header/ms-cl-header"
import MsClTable from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-table/ms-cl-table"
import MsMobileClTable from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-table/mobile/ms-mobile-cl-table"
import MonitorScanDialog from "@/components/hospital/monitoring/monitor-scan/monitor-scan-dialog"
import VoiceInputDialog from "@/components/hospital/monitoring/monitor-scan/voice-input-dialog"
import DeviceProfileManageSheet from "@/components/hospital/monitoring/device-profile/device-profile-manage-sheet"
import { useMonitoringContextData } from "@/providers/monitoring-hos-data-context-provider"
import type { MsClTableBodyHandle } from "./session-cl-table/ms-cl-table-body"
import type { DeviceProfile } from "@/types/monitoring/device-profile-type"
import type { MsMemo, VitalTimeSlot } from "@/types/monitoring/monitoring-type"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ConflictState = {
    slot: VitalTimeSlot
    existingIndex: number
    conflictNames: string[]
}

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClContainer({ msData }: Props) {
    const { msContextData } = useMonitoringContextData()
    const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>(msContextData.deviceProfiles)
    const tableRef = useRef<MsClTableBodyHandle>(null)
    const [conflict, setConflict] = useState<ConflictState | null>(null)

    const pendingTreatmentMemos = ((msData.memo_tx as MsMemo[]) ?? [])
        .filter((m) => !m.is_realtime_memo && !m.is_done)
        .map((m) => ({ id: m.id, memo: m.memo }))

    const handleInsertRow = (slot: VitalTimeSlot) => {
        // 경과 시간(분) 계산 — create_timestamp가 밀리초 문자열인 경우 처리
        let elapsedMin: number | null = null
        if (msData.start_time) {
            const nowMs = /^\d+$/.test(slot.create_timestamp)
                ? parseInt(slot.create_timestamp)
                : new Date(slot.create_timestamp).getTime()
            elapsedMin = Math.max(0, Math.floor((nowMs - new Date(msData.start_time).getTime()) / 60000))
        }

        // 우선순위 1: 값 없는 템플릿 슬롯 중 현재 경과 시간 이하에서 가장 가까운 것
        const templateMatch = elapsedMin !== null
            ? tableRef.current?.findBestTemplateSlot(elapsedMin) ?? null
            : null

        // 우선순위 2: minTime이 정확히 일치하는 기존 슬롯
        const exactMatch = !templateMatch
            ? tableRef.current?.findSlotByMinTime(slot.minTime) ?? null
            : null

        const target = templateMatch ?? exactMatch

        if (!target) {
            tableRef.current?.insertRow(slot)
            toast.success(`${slot.vitals.length}개 항목이 체크리스트에 추가되었습니다.`)
            return
        }

        // 충돌 검사 — 이미 값이 있는 항목만 대상 (빈 값은 충돌 아님)
        const filledNames = new Set(target.slot.vitals.filter(v => v.value?.trim()).map(v => v.vitalName))
        const conflictNames = slot.vitals.filter(v => filledNames.has(v.vitalName)).map(v => v.vitalName)

        const label = templateMatch
            ? `${target.slot.minTime}분 예약 슬롯`
            : `${target.slot.minTime}분 기록`

        if (conflictNames.length === 0) {
            tableRef.current?.mergeIntoSlot(target.index, slot.vitals, 'overwrite')
            toast.success(`${label}에 ${slot.vitals.length}개 항목이 입력되었습니다.`)
        } else {
            setConflict({ slot, existingIndex: target.index, conflictNames })
        }
    }

    const handleOverwrite = () => {
        if (!conflict) return
        tableRef.current?.mergeIntoSlot(conflict.existingIndex, conflict.slot.vitals, 'overwrite')
        toast.success(`${conflict.slot.minTime}분 기록이 업데이트되었습니다.`)
        setConflict(null)
    }

    const handleAddNewRow = () => {
        if (!conflict) return
        tableRef.current?.insertRow(conflict.slot)
        toast.success(`${conflict.slot.vitals.length}개 항목이 새 행으로 추가되었습니다.`)
        setConflict(null)
    }

    return (
        <div className="flex flex-col gap-4">
            <MsClHeader msData={msData} />

            {/* 사진 입력 / 장비 설정 버튼 */}
            <div className="flex items-center gap-2 px-2">
                <MonitorScanDialog
                    sessionId={msData.session_id}
                    hosId={msData.hos_id}
                    profiles={deviceProfiles}
                    vitalRefRange={msContextData.vitalRefRange}
                    recentSlots={msData.vital_results ?? []}
                    species={msData.patient?.species as 'canine' | 'feline' | null ?? null}
                    sessionTitle={msData.session_title}
                    startTime={msData.start_time ?? null}
                    intervalSetting={msData.interval_setting ?? null}
                    onInsertRow={handleInsertRow}
                />
                <VoiceInputDialog
                    sessionId={msData.session_id}
                    species={msData.patient?.species as 'canine' | 'feline' | null ?? null}
                    sessionTitle={msData.session_title}
                    startTime={msData.start_time ?? null}
                    intervalSetting={msData.interval_setting ?? null}
                    treatmentMemos={pendingTreatmentMemos}
                    onInsertRow={handleInsertRow}
                />
                <DeviceProfileManageSheet
                    hosId={msData.hos_id}
                    profiles={deviceProfiles}
                    onProfilesChange={setDeviceProfiles}
                />
            </div>

            <div className="hidden md:block">
                <MsClTable ref={tableRef} msData={msData} />
            </div>

            <div className="md:hidden">
                <MsMobileClTable msData={msData} />
            </div>

            {/* 충돌 해결 다이얼로그 */}
            <Dialog open={!!conflict} onOpenChange={(v) => { if (!v) setConflict(null) }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>동일 시간대 항목 중복</DialogTitle>
                    </DialogHeader>
                    {conflict && (
                        <div className="flex flex-col gap-4 pt-1">
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold">{conflict.slot.minTime}분</span> 기록에 이미{' '}
                                <span className="font-semibold text-amber-600">
                                    {conflict.conflictNames.join(', ')}
                                </span>{' '}
                                값이 있습니다. 어떻게 처리할까요?
                            </p>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddNewRow}
                                >
                                    새 행으로 추가
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={handleOverwrite}
                                >
                                    기존 값 덮어쓰기
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

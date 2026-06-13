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
import type { VitalTimeSlot } from "@/types/monitoring/monitoring-type"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClContainer({ msData }: Props) {
    const { msContextData } = useMonitoringContextData()
    const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>(msContextData.deviceProfiles)
    const tableRef = useRef<MsClTableBodyHandle>(null)

    const handleInsertRow = (slot: VitalTimeSlot) => {
        tableRef.current?.insertRow(slot)
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
                    onInsertRow={handleInsertRow}
                />
                <VoiceInputDialog
                    sessionId={msData.session_id}
                    species={msData.patient?.species as 'canine' | 'feline' | null ?? null}
                    sessionTitle={msData.session_title}
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
        </div>
    )
}

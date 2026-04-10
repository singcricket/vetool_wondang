// import type { ChecklistWithPatientWithWeight } from '@/lib/services/checklist/checklist-data'
// import ClHeaderActions from './cl-header-actions'
// import ClPatientUpdateDialog from './cl-patient-update-dialog'
// import ClTimeIndicator from './cl-time-indicator/cl-time-indicator'

import type { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import MsTimeIndicator from "@/components/hospital/monitoring/session-header/ms-time-indicator"
import MsPatientUpdateDialog from "@/components/hospital/monitoring/session-header/ms-patient-update-dialog"
import MsHeaderRightButtons from "./ms-header-right-buttons"

type Props = {
  hosId: string
  targetDate: string
  msData: MsWithPatientWithWeight
  isVet: boolean
}

export default function SessionHeader({
  hosId,
  targetDate,
  msData,
  isVet,
}: Props) {
  const { end_time, start_time } = msData

  return (
    <header className="sticky top-0 z-40 flex min-h-12 flex-col items-center justify-center gap-2 border-b bg-background py-2 2xl:h-12 2xl:flex-row 2xl:py-0">
      <MsTimeIndicator
        startTime={start_time}
        endTime={end_time}
        sessionId={msData.session_id}
      />

      <MsPatientUpdateDialog
        hosId={hosId}
        targetDate={targetDate}
        patient={msData.patient!}
        sessionId={msData.session_id}
        msData={msData}
      />

      {isVet && (
        <MsHeaderRightButtons
          msData={msData}
          hosId={hosId}
          targetDate={targetDate}
        />
      )}
    </header>
  )
}

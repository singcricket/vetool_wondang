// import type { ChecklistWithPatientWithWeight } from '@/lib/services/checklist/checklist-data'
// import ClHeaderActions from './cl-header-actions'
// import ClPatientUpdateDialog from './cl-patient-update-dialog'
// import ClTimeIndicator from './cl-time-indicator/cl-time-indicator'

import type { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import MsTimeIndicator from "@/components/hospital/monitoring/session-header/ms-time-indicator"
import MsPatientUpdateDialog from "@/components/hospital/monitoring/session-header/ms-patient-update-dialog"

type Props = {
  hosId: string
  targetDate: string
  msData: MsWithPatientWithWeight
}

export default function SessionHeader({
  hosId,
  targetDate,
  msData,
}: Props) {
  const { end_time, start_time } = msData

  return (
    <header className="relative flex h-12 items-center justify-center border-b">
        
      <MsTimeIndicator
        startTime={start_time}
        endTime={end_time}
        sessionId={msData.session_id}
      />

      <MsPatientUpdateDialog
        hosId={hosId}
        targetDate={targetDate}
        patient={msData.patient!}
      />

      {/* <ClHeaderActions checklistData={checklistData} /> */}
    </header>
  )
}


import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'

import MsInfoContainer from '@/components/hospital/monitoring/session-body/session-info/session-info-container'
import MsMemoContainer from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-container'
import MsClContainer from '@/components/hospital/monitoring/session-body/session-checklist/ms-cl-container'
type Props = {
  msData : MsWithPatientWithWeight
  targetDate: string
  hosId: string
}

export default function SessionBody({ msData, targetDate, hosId }: Props) {
 
  return (
    <div className="mt-12 flex w-full flex-col gap-2 p-2 pb-32">
        <MsInfoContainer msData={msData} />
        <MsMemoContainer msData={msData} />
        <MsClContainer msData={msData} />
    </div>
  )
}

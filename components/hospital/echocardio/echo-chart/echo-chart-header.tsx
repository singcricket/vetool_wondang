'use client'

import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'
import EchoPatientUpdateDialog from './echo-patient-update-dialog'
import EchoHeaderRightButtons from './echo-header-right-buttons'

type Props = {
  hosId: string
  targetDate: string
  chartDetail: EchoChartDetail
}

export default function EchoChartHeader({ hosId, targetDate, chartDetail }: Props) {
  return (
    <header className="sticky top-0 z-40 flex min-h-12 flex-col items-center justify-center gap-2 border-b bg-background py-2 2xl:h-12 2xl:flex-row 2xl:py-0">
      <EchoPatientUpdateDialog chartDetail={chartDetail} />

      <EchoHeaderRightButtons
        hosId={hosId}
        targetDate={targetDate}
        echoId={chartDetail.id}
      />
    </header>
  )
}

'use client'

import type { DentalChartDetail } from '@/types/dental/dental-type'
import DentalPatientUpdateDialog from './dental-patient-update-dialog'
import DentalHeaderRightButtons from './dental-header-right-buttons'
import DentalChartHistorySelect from './dental-chart-history-select'

type Props = {
  hosId: string
  targetDate: string
  chartDetail: DentalChartDetail
}

export default function DentalChartHeader({ hosId, targetDate, chartDetail }: Props) {
  return (
    <header className="sticky top-0 z-40 flex min-h-12 flex-col items-center justify-center gap-2 border-b bg-background py-2 2xl:h-12 2xl:flex-row 2xl:py-0">
      <DentalPatientUpdateDialog chartDetail={chartDetail} />

      <div className="flex items-center gap-2">
        <DentalHeaderRightButtons
          hosId={hosId}
          targetDate={targetDate}
          chartDetail={chartDetail}
        />
        
        <DentalChartHistorySelect 
          hosId={hosId}
          currentDentalId={chartDetail.id}
          patientId={chartDetail.patient_id}
        />
      </div>
    </header>
  )
}

'use client'

import type { DentalChartDetail } from '@/types/dental/dental-type'
import DeleteDentalChartDialog from './delete-dental-chart-dialog'

type Props = {
  hosId: string
  targetDate: string
  chartDetail: DentalChartDetail
}

export default function DentalHeaderRightButtons({
  hosId,
  targetDate,
  chartDetail,
}: Props) {
  return (
    <div className="flex items-center gap-1">
      <DeleteDentalChartDialog
        chartDetail={chartDetail}
        hosId={hosId}
        targetDate={targetDate}
      />
    </div>
  )
}

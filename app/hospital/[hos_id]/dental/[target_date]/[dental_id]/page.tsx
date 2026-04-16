import { notFound } from 'next/navigation'
import { fetchDentalChartDetail, fetchDentalChartTeeth } from '@/lib/services/dental/fetch-dental-chart'
import DentalChartHeader from '@/components/hospital/dental/dental-chart/dental-chart-header'
import DentalChartBody from '@/components/hospital/dental/dental-chart/dental-chart-body'

export default async function DentalChartPage(props: {
  params: Promise<{ hos_id: string; target_date: string; dental_id: string }>
}) {
  const params = await props.params
  const { hos_id, target_date, dental_id } = params

  const [chartDetail, teeth] = await Promise.all([
    fetchDentalChartDetail(dental_id),
    fetchDentalChartTeeth(dental_id),
  ])

  if (!chartDetail) notFound()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DentalChartHeader
        chartDetail={chartDetail}
        hosId={hos_id}
        targetDate={target_date}
      />
      <DentalChartBody
        chartDetail={chartDetail}
        teeth={teeth}
        hosId={hos_id}
      />
    </div>
  )
}

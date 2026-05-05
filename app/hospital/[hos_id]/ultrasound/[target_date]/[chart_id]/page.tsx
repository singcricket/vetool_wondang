import { getUltrasoundChart } from '@/lib/services/ultrasound/ultrasound-charts'
import { redirect } from 'next/navigation'
import UltrasoundChartClient from './ultrasound-chart-client'

export const metadata = {
  title: '복부 초음파 차트',
}

interface Props {
  params: Promise<{
    hos_id: string
    target_date: string
    chart_id: string
  }>
}

export default async function UltrasoundChartPage({ params }: Props) {
  const resolvedParams = await params
  const { hos_id, chart_id, target_date } = resolvedParams

  const chartDetail = await getUltrasoundChart(chart_id)

  if (!chartDetail) {
    redirect(`/hospital/${hos_id}?error=chart_not_found`)
  }

  return (
    <UltrasoundChartClient
      hosId={hos_id}
      chartId={chart_id}
      chartDate={target_date}
      chartDetail={chartDetail}
    />
  )
}

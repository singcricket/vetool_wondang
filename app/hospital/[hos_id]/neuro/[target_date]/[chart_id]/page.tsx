import { getNeuroChart } from '@/lib/services/neuro/neuro-charts'
import { redirect } from 'next/navigation'
import NeuroChartClient from './neuro-chart-client'

interface Props {
  params: Promise<{
    hos_id: string
    target_date: string
    chart_id: string
  }>
}

export default async function NeuroChartPage({ params }: Props) {
  const resolvedParams = await params
  const { hos_id, chart_id, target_date } = resolvedParams

  const chartDetail = await getNeuroChart(chart_id)

  if (!chartDetail) {
    redirect(`/hospital/${hos_id}?error=chart_not_found`)
  }

  return (
    <NeuroChartClient
      hosId={hos_id}
      chartId={chart_id}
      chartDate={target_date}
      chartDetail={chartDetail}
    />
  )
}

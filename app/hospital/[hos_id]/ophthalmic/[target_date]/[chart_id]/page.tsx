import { getOphthalmicChart } from '@/lib/services/ophthalmic/ophthalmic-charts'
import { redirect } from 'next/navigation'
import OphthalmicChartClient from './ophthalmic-chart-client'

interface Props {
  params: Promise<{
    hos_id: string
    target_date: string
    chart_id: string
  }>
}

export default async function OphthalmicChartPage({ params }: Props) {
  const resolvedParams = await params
  const { hos_id, chart_id, target_date } = resolvedParams

  const chartDetail = await getOphthalmicChart(chart_id)

  if (!chartDetail) {
    redirect(`/hospital/${hos_id}/ophthalmic/${target_date}?error=chart_not_found`)
  }

  return (
    <OphthalmicChartClient
      hosId={hos_id}
      chartId={chart_id}
      chartDate={target_date}
      chartDetail={chartDetail}
    />
  )
}

import { getCytologyChart } from '@/lib/services/cytology/cytology-charts'
import { fetchCytologyLayoutData } from '@/lib/services/cytology/fetch-cytology'
import { redirect } from 'next/navigation'
import CytologyChartClient from './cytology-chart-client'

interface Props {
  params: Promise<{
    hos_id: string
    target_date: string
    chart_id: string
  }>
}

export default async function CytologyChartPage({ params }: Props) {
  const { hos_id, target_date, chart_id } = await params

  const [chartDetail, layoutData] = await Promise.all([
    getCytologyChart(chart_id),
    fetchCytologyLayoutData(hos_id),
  ])

  if (!chartDetail) {
    redirect(`/hospital/${hos_id}/cytology/${target_date}`)
  }

  return (
    <CytologyChartClient
      hosId={hos_id}
      chartId={chart_id}
      chartDate={target_date}
      chartDetail={chartDetail}
      vetList={layoutData.vetList}
    />
  )
}

import { getCytologyChart } from '@/lib/services/cytology/cytology-charts'
import { redirect } from 'next/navigation'
import CytologyChartClient from './cytology-chart-client'

export const metadata = {
  title: '세포학 검사 차트',
}

interface Props {
  params: Promise<{
    hos_id: string
    target_date: string
    chart_id: string
  }>
}

export default async function CytologyChartPage({ params }: Props) {
  const { hos_id, target_date, chart_id } = await params

  const chartDetail = await getCytologyChart(chart_id)

  if (!chartDetail) {
    redirect(`/hospital/${hos_id}/cytology/${target_date}`)
  }

  return (
    <CytologyChartClient
      hosId={hos_id}
      chartId={chart_id}
      chartDate={target_date}
      chartDetail={chartDetail}
    />
  )
}

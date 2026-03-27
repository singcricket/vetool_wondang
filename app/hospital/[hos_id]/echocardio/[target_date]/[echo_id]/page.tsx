import { fetchEchoChartDetail } from '@/lib/services/echocardio/fetch-echo'
import { fetchPatientEchoHistory } from '@/lib/services/echocardio/fetch-echo'
import { fetchEchoGuideImages } from '@/lib/services/echocardio/fetch-echo'
import EchoChartView from '@/components/hospital/echocardio/echo-chart/echo-chart-view'
import { notFound } from 'next/navigation'

export default async function EchoChartPage(props: {
  params: Promise<{ hos_id: string; target_date: string; echo_id: string }>
}) {
  const params = await props.params
  const { hos_id, echo_id } = params

  const chartDetail = await fetchEchoChartDetail(echo_id)
  if (!chartDetail) notFound()

  const [history, guideImages] = await Promise.all([
    fetchPatientEchoHistory(chartDetail.patient_id, echo_id),
    fetchEchoGuideImages(hos_id),
  ])

  return (
    <EchoChartView
      chartDetail={chartDetail}
      history={history}
      guideImages={guideImages}
      hosId={hos_id}
    />
  )
}

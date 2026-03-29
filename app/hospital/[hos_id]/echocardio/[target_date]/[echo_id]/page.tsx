import { fetchEchoChartDetail, fetchPatientEchoHistory, fetchActiveTemplateGuideImages } from '@/lib/services/echocardio/fetch-echo'
import EchoChartHeader from '@/components/hospital/echocardio/echo-chart/echo-chart-header'
import EchoChartBody from '@/components/hospital/echocardio/echo-chart/echo-chart-view'
import { notFound } from 'next/navigation'

export default async function EchoChartPage(props: {
  params: Promise<{ hos_id: string; target_date: string; echo_id: string }>
}) {
  const params = await props.params
  const { hos_id, target_date, echo_id } = params

  const chartDetail = await fetchEchoChartDetail(echo_id)
  if (!chartDetail) notFound()

  const [history, guideImages] = await Promise.all([
    fetchPatientEchoHistory(chartDetail.patient_id, echo_id),
    fetchActiveTemplateGuideImages(hos_id),
  ])

  return (
    <div className="relative flex flex-col">
      <EchoChartHeader
        hosId={hos_id}
        targetDate={target_date}
        chartDetail={chartDetail}
      />
      <EchoChartBody
        chartDetail={chartDetail}
        history={history}
        guideImages={guideImages}
        hosId={hos_id}
      />
    </div>
  )
}

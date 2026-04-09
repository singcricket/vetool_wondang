import {
  fetchEchoChartDetail,
  fetchPatientEchoHistory,
  fetchActiveTemplateGuideImages,
  fetchTemplateGuideImages,
  fetchActiveTemplate,
  fetchEchoTemplates,
} from '@/lib/services/echocardio/fetch-echo'
import EchoChartHeader from '@/components/hospital/echocardio/echo-chart/echo-chart-header'
import EchoChartBody from '@/components/hospital/echocardio/echo-chart/echo-chart-view'
import EchoChartEntry from '@/components/hospital/echocardio/echo-chart/echo-chart-entry'
import { notFound } from 'next/navigation'
import type { Species } from '@/types/echocardio/echocardio-type'

export default async function EchoChartPage(props: {
  params: Promise<{ hos_id: string; target_date: string; echo_id: string }>
}) {
  const params = await props.params
  const { hos_id, target_date, echo_id } = params

  const chartDetail = await fetchEchoChartDetail(echo_id)
  if (!chartDetail) notFound()

  const species: Species =
    chartDetail.patient.species?.toLowerCase() === 'cat' ||
    chartDetail.patient.species?.toLowerCase() === 'feline'
      ? 'feline'
      : 'canine'

  // 결과가 하나도 없는 경우 (차트 초기 진입 상태)
  if (chartDetail.results.length === 0) {
    const [defaultTemplate, allTemplates] = await Promise.all([
      fetchActiveTemplate(hos_id, species),
      fetchEchoTemplates(hos_id),
    ])

    return (
      <EchoChartEntry
        hosId={hos_id}
        echoId={echo_id}
        species={species}
        defaultTemplate={defaultTemplate}
        allTemplates={allTemplates}
      />
    )
  }

  const [history, guideImages] = await Promise.all([
    fetchPatientEchoHistory(chartDetail.patient_id, echo_id),
    chartDetail.template_id
      ? fetchTemplateGuideImages(chartDetail.template_id)
      : fetchActiveTemplateGuideImages(hos_id, species),
  ])

  return (
    <div className="relative flex flex-col h-desktop overflow-hidden">
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

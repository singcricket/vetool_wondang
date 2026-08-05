import NeuroChartClient from '../[chart_id]/neuro-chart-client'

interface Props {
  params: Promise<{
    hos_id: string
    target_date: string
  }>
}

// 미등록 환자용 빈 차트 데이터
const GUEST_CHART_DETAIL = {
  id: 'guest',
  hos_id: '',
  patient_id: '',
  chart_date: '',
  results: {},
  localisations: {},
  summary: null,
  evaluator_id: null,
  created_at: '',
  updated_at: '',
  patient: null,
  evaluator: null,
}

export default async function NeuroGuestPage({ params }: Props) {
  const { hos_id, target_date } = await params

  return (
    <NeuroChartClient
      hosId={hos_id}
      chartId="guest"
      chartDate={target_date}
      chartDetail={GUEST_CHART_DETAIL as any}
      guestMode
    />
  )
}

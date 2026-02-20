import NoResultSquirrel from '@/components/common/no-result-squirrel'
// import ChecklistBody from '@/components/hospital/checklist/checklist-body/checklist-body'

import SessionHeader from '@/components/hospital/monitoring/session-header/session-header'
import { fetchMsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'

export default async function SessionMainPage(props: {
  params: Promise<{
    hos_id: string
    target_date: string
    session_id: string
  }>
}) {
  const { session_id, target_date, hos_id } = await props.params

  const msData = await fetchMsWithPatientWithWeight(session_id)

  if (!msData) {
    return (
      <NoResultSquirrel
        text="모니터링 세션이 없습니다"
        className="mt-40 flex-col"
        size="lg"
      />
    )
  }

  return (
    <div className="flex-col">
      <SessionHeader
        hosId={hos_id}
        targetDate={target_date}
        msData={msData}
      />

      {/* <ChecklistBody checklistData={checklistData} /> */}
    </div>
  )
}

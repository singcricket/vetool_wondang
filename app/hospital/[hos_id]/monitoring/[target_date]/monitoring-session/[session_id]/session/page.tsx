import MobileTitle from '@/components/common/mobile-title'
import NoResultSquirrel from '@/components/common/no-result-squirrel'
import SessionBody from '@/components/hospital/monitoring/session-body/session-body'
import SessionHeader from '@/components/hospital/monitoring/session-header/session-header'
import { fetchMsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { ClipboardListIcon } from 'lucide-react'
import { getVetoolUserData } from '@/lib/services/auth/authorization'

export default async function SessionMainPage(props: {
  params: Promise<{
    hos_id: string
    target_date: string
    session_id: string
  }>
}) {
  const { session_id, target_date, hos_id } = await props.params
  const vetoolUser = await getVetoolUserData()
  const isVet = vetoolUser.is_vet || vetoolUser.is_super

  const msData = await fetchMsWithPatientWithWeight(session_id)

  if (!msData) {
    return (
      <>
        <MobileTitle icon={ClipboardListIcon} title="모니터링" />
        <NoResultSquirrel
          text="모니터링 세션이 없습니다"
          className="mt-40 flex-col"
          size="lg"
        />
      </>
    )
  }

  return (
    <>
      <div className="relative flex flex-col">
        <MobileTitle icon={ClipboardListIcon} title="모니터링" />
        <SessionHeader
          hosId={hos_id}
          targetDate={target_date}
          msData={msData}
          isVet={isVet}
        />
        <SessionBody
          hosId={hos_id}
          targetDate={target_date}
          msData={msData}
          isVet={isVet}
        />
      </div>
    </>
  )
}

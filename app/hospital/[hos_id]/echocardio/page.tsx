import { hasPermissions } from '@/constants/company/plans'
import { getPlan } from '@/lib/services/auth/plan'
import UpgragePlanPromptModal from '@/components/hospital/common/upgrade-plan-prompt-modal'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function EchocardioPage(props: {
  params: Promise<{ hos_id: string }>
}) {
  const params = await props.params
  const plan = await getPlan(params.hos_id)

  const isEchocardioEnabled = hasPermissions(plan, 'ECHOCARDIO')

  if (!isEchocardioEnabled) {
    return <UpgragePlanPromptModal />
  }

  redirect(
    `/hospital/${params.hos_id}/echocardio/${format(new Date(), 'yyyy-MM-dd')}`,
  )
}

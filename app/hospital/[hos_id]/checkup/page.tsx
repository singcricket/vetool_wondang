import UpgragePlanPromptModal from '@/components/hospital/common/upgrade-plan-prompt-modal'
import { hasPermissions } from '@/constants/company/plans'
import { getPlan } from '@/lib/services/auth/plan'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function CheckupPage(props: {
  params: Promise<{ hos_id: string }>
}) {
  const params = await props.params
  const plan = await getPlan(params.hos_id)

  const isCheckupEnabled = hasPermissions(plan, 'CHECKUP')

  if (!isCheckupEnabled) {
    return <UpgragePlanPromptModal />
  }

  redirect(`/hospital/${params.hos_id}/checkup/${format(new Date(), 'yyyy-MM-dd')}`)
}

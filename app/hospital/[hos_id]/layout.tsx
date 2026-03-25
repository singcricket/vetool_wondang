import ClientRedirect from '@/components/common/client-redirect'
import DesktopSidebar from '@/components/hospital/common/sidebar/desktop-sidebar/desktop-sidebar'
import MobileLayout from '@/components/hospital/common/sidebar/mobile-layout/mobile-layout'
import { getVetoolUserData } from '@/lib/services/auth/authorization'
import { MonitoringNotificationProvider } from '@/providers/monitoring-notification-provider'

export default async function HospitalLayout(
  props: LayoutProps<'/hospital/[hos_id]'>,
) {
  const { hos_id } = await props.params
  const vetoolUser = await getVetoolUserData()
  const isSuper = vetoolUser.is_super

  if (!isSuper && vetoolUser.hos_id !== hos_id) {
    return <ClientRedirect to={`/hospital/${vetoolUser.hos_id}`} />
  }

  const plan = 'severe'

  return (
    <div className="flex">
      <DesktopSidebar hosId={hos_id} vetoolUser={vetoolUser} plan={plan} />

      <div className="ml-0 flex-1 2xl:ml-10">
        <MobileLayout hosId={hos_id} vetoolUser={vetoolUser} plan={plan} />
        <main className="mt-12 2xl:mt-0">
          <MonitoringNotificationProvider hosId={hos_id}>
            {props.children}
          </MonitoringNotificationProvider>
        </main>
      </div>
    </div>
  )
}

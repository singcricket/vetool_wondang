import { fetchEchoLayoutData } from '@/lib/services/echocardio/echo-layout'
import { fetchEchoSettings } from '@/lib/services/echocardio/fetch-echo'
import { fetchEchoSidebarData } from '@/lib/services/echocardio/fetch-echo'
import { getEchoTestUIMeta } from '@/constants/hospital/echocardio/echo-tests'
import { EchoContextProvider } from '@/providers/echo-context-provider'
import EchoSidebar from '@/components/hospital/echocardio/echo-sidebar/echo-sidebar'

export default async function EchoLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const [layoutData, settings, sidebarItems] = await Promise.all([
    fetchEchoLayoutData(hos_id),
    fetchEchoSettings(hos_id),
    fetchEchoSidebarData(hos_id, target_date),
  ])

  const testUIMeta = getEchoTestUIMeta()

  const echoContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
    settings,
    testUIMeta,
  }

  return (
    <EchoContextProvider echoContextData={echoContextData}>
      <div className="flex h-full w-full">
        {/* 사이드바 */}
        <aside className="hidden w-[200px] shrink-0 2xl:block">
          <EchoSidebar
            hosId={hos_id}
            targetDate={target_date}
            initialItems={sidebarItems}
          />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="min-w-0 flex-1 overflow-auto">{props.children}</main>
      </div>
    </EchoContextProvider>
  )
}

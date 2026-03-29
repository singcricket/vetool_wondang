import { fetchEchoLayoutData } from '@/lib/services/echocardio/echo-layout'
import { fetchActiveTemplate, fetchEchoTemplates, fetchEchoSidebarData } from '@/lib/services/echocardio/fetch-echo'
import { getEchoTestUIMeta } from '@/constants/hospital/echocardio/echo-tests'
import { EchoContextProvider } from '@/providers/echo-context-provider'
import EchoSidebar from '@/components/hospital/echocardio/echo-sidebar/echo-sidebar'
import EchoFooter from '@/components/hospital/echocardio/echo-footer/echo-footer'

export default async function EchoLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const [layoutData, template, templates, sidebarItems] = await Promise.all([
    fetchEchoLayoutData(hos_id),
    fetchActiveTemplate(hos_id),
    fetchEchoTemplates(hos_id),
    fetchEchoSidebarData(hos_id, target_date),
  ])

  const testUIMeta = getEchoTestUIMeta()

  const echoContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
    template,
    templates,
    testUIMeta,
  }

  return (
    <EchoContextProvider echoContextData={echoContextData}>
      <div className="flex h-desktop">
        {/* 사이드바 */}
        <aside className="hidden w-[200px] shrink-0 2xl:block">
          <EchoSidebar
            hosId={hos_id}
            targetDate={target_date}
            initialItems={sidebarItems}
          />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="h-desktop min-w-0 flex-1 overflow-auto pb-10 2xl:ml-0">
          {props.children}
        </main>
      </div>

      <EchoFooter hosId={hos_id} targetDate={target_date} />
    </EchoContextProvider>
  )
}

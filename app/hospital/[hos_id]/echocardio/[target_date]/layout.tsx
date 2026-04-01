import { fetchEchoLayoutData } from '@/lib/services/echocardio/echo-layout'
import { fetchActiveTemplate, fetchEchoTemplates } from '@/lib/services/echocardio/fetch-echo'
import { getAllEchoTestUIMeta } from '@/constants/hospital/echocardio/echo-tests'
import { EchoContextProvider } from '@/providers/echo-context-provider'
import EchoSidebar from '@/components/hospital/echocardio/echo-sidebar/echo-sidebar'
import EchoFooter from '@/components/hospital/echocardio/echo-footer/echo-footer'

export default async function EchoLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const [layoutData, template, templates] = await Promise.all([
    fetchEchoLayoutData(hos_id),
    fetchActiveTemplate(hos_id),
    fetchEchoTemplates(hos_id),
  ])

  const testUIMeta = getAllEchoTestUIMeta()

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
        <EchoSidebar
          hosId={hos_id}
          targetDate={target_date}
        />

        {/* 메인 콘텐츠 */}
      <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-96 2xl:w-auto">
          {props.children}
        </div>
      </div>

      <EchoFooter hosId={hos_id} targetDate={target_date} />
    </EchoContextProvider>
  )
}

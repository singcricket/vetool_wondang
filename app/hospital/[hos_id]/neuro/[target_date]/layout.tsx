import { fetchNeuroLayoutData } from '@/lib/services/neuro/fetch-neuro'
import { NeuroContextProvider } from '@/providers/neuro-context-provider'
import NeuroSidebar from '@/components/hospital/neuro/neuro-sidebar/neuro-sidebar'
import NeuroFooter from '@/components/hospital/neuro/neuro-footer/neuro-footer'

export default async function NeuroLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const layoutData = await fetchNeuroLayoutData(hos_id)

  const neuroContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
  }

  return (
    <NeuroContextProvider neuroContextData={neuroContextData}>
      <div className="flex h-desktop">
        <NeuroSidebar
          hosId={hos_id}
          targetDate={target_date}
        />

        {/* 메인 콘텐츠 */}
        <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          {props.children}
        </div>

        <NeuroFooter hosId={hos_id} targetDate={target_date} />
      </div>
    </NeuroContextProvider>
  )
}

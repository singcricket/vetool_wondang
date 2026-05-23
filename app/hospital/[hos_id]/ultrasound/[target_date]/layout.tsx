import { fetchUltrasoundLayoutData } from '@/lib/services/ultrasound/ultrasound-layout'
import { UltrasoundContextProvider } from '@/providers/ultrasound-context-provider'
import UltrasoundSidebar from '@/components/hospital/ultrasound/ultrasound-sidebar/ultrasound-sidebar'
import UltrasoundFooter from '@/components/hospital/ultrasound/ultrasound-footer/ultrasound-footer'

export default async function UltrasoundLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const [layoutData] = await Promise.all([
    fetchUltrasoundLayoutData(hos_id),
  ])

  const ultrasoundContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
  }

  return (
    <UltrasoundContextProvider ultrasoundContextData={ultrasoundContextData}>
      <div className="flex h-desktop">
        <UltrasoundSidebar
          hosId={hos_id}
          targetDate={target_date}
        />

        {/* 메인 콘텐츠 */}
        <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          {props.children}
        </div>

        <UltrasoundFooter hosId={hos_id} targetDate={target_date} />
      </div>
    </UltrasoundContextProvider>
  )
}

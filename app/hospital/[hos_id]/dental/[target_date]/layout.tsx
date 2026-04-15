import { fetchDentalLayoutData } from '@/lib/services/dental/dental-layout'
import { DentalContextProvider } from '@/providers/dental-context-provider'
import DentalSidebar from '@/components/hospital/dental/dental-sidebar/dental-sidebar'
import DentalFooter from '@/components/hospital/dental/dental-footer/dental-footer'

export default async function DentalLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const [layoutData] = await Promise.all([
    fetchDentalLayoutData(hos_id),
  ])

  const dentalContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
  }

  return (
    <DentalContextProvider dentalContextData={dentalContextData}>
      <div className="flex h-desktop">
        <DentalSidebar
          hosId={hos_id}
          targetDate={target_date}
        />

        {/* 메인 콘텐츠 */}
      <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto">
          {props.children}
        </div>
      </div>

      <DentalFooter hosId={hos_id} targetDate={target_date} />
    </DentalContextProvider>
  )
}

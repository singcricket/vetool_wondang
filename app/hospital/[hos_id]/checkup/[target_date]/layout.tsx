import { fetchCheckupLayoutData } from '@/lib/services/checkup/checkup-layout'
import { CheckupContextProvider } from '@/providers/checkup-context-provider'
import CheckupSidebar from '@/components/hospital/checkup/checkup-sidebar/checkup-sidebar'

export default async function CheckupLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const layoutData = await fetchCheckupLayoutData(hos_id)

  return (
    <CheckupContextProvider
      checkupContextData={{
        hosId: hos_id,
        targetDate: target_date,
        vetsList: layoutData.vetList,
      }}
    >
      <div className="flex h-desktop">
        <CheckupSidebar hosId={hos_id} targetDate={target_date} />

        <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto">
          {props.children}
        </div>
      </div>
    </CheckupContextProvider>
  )
}

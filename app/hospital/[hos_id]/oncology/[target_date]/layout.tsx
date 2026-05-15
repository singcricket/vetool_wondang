import { fetchOncologyLayoutData } from '@/lib/services/oncology/oncology-layout'
import { OncologyContextProvider } from '@/providers/oncology-context-provider'
import OncologySidebar from '@/components/hospital/oncology/oncology-sidebar/oncology-sidebar'
import OncologyFooter from '@/components/hospital/oncology/oncology-footer/oncology-footer'

export default async function OncologyLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const layoutData = await fetchOncologyLayoutData(hos_id)

  const oncologyContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
  }

  return (
    <OncologyContextProvider oncologyContextData={oncologyContextData}>
      <div className="flex h-desktop">
        <OncologySidebar hosId={hos_id} targetDate={target_date} />

        <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto">
          {props.children}
        </div>
      </div>

      <OncologyFooter hosId={hos_id} targetDate={target_date} />
    </OncologyContextProvider>
  )
}

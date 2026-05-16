import { fetchOphthalmicLayoutData } from '@/lib/services/ophthalmic/fetch-ophthalmic'
import { OphthalmicContextProvider } from '@/providers/ophthalmic-context-provider'
import OphthalmicSidebar from '@/components/hospital/ophthalmic/ophthalmic-sidebar/ophthalmic-sidebar'
import OphthalmicFooter from '@/components/hospital/ophthalmic/ophthalmic-footer/ophthalmic-footer'

export default async function OphthalmicLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  const layoutData = await fetchOphthalmicLayoutData(hos_id)

  const ophthalmicContextData = {
    hosId: hos_id,
    targetDate: target_date,
    vetsList: layoutData.vetList,
  }

  return (
    <OphthalmicContextProvider ophthalmicContextData={ophthalmicContextData}>
      <div className="flex h-desktop">
        <OphthalmicSidebar
          hosId={hos_id}
          targetDate={target_date}
        />

        {/* 메인 콘텐츠 */}
        <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          {props.children}
        </div>

        <OphthalmicFooter hosId={hos_id} targetDate={target_date} />
      </div>
    </OphthalmicContextProvider>
  )
}

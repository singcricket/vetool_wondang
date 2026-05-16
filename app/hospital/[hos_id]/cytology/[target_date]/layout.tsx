import CytologySidebar from '@/components/hospital/cytology/cytology-sidebar/cytology-sidebar'
import CytologyFooter from '@/components/hospital/cytology/cytology-footer/cytology-footer'

export default async function CytologyLayout(props: {
  children: React.ReactNode
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const params = await props.params
  const { hos_id, target_date } = params

  return (
    <>
      <div className="flex h-desktop">
        <CytologySidebar hosId={hos_id} targetDate={target_date} />

        <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop pb-10 2xl:ml-[200px] 2xl:w-auto">
          {props.children}
        </div>
      </div>

      <CytologyFooter hosId={hos_id} targetDate={target_date} />
    </>
  )
}

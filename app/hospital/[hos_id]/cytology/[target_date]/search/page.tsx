import MobileTitle from '@/components/common/mobile-title'
import { SearchIcon } from 'lucide-react'
import { getAllCytologyCharts } from '@/lib/services/cytology/fetch-cytology'
import CytologySearchEntry from '@/components/hospital/cytology/cytology-search/cytology-search-entry'

export default async function CytologySearchPage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const { hos_id } = await props.params
  const charts = await getAllCytologyCharts(hos_id)

  return (
    <div className="flex flex-col gap-4">
      <MobileTitle icon={SearchIcon} title="세포학 차트 검색" />
      <CytologySearchEntry charts={charts} hosId={hos_id} />
    </div>
  )
}

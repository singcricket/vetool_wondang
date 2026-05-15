import MobileTitle from '@/components/common/mobile-title'
import { SearchIcon } from 'lucide-react'
import { getOncologyCases } from '@/lib/services/oncology/fetch-oncology'
import OncologySearchEntry from '@/components/hospital/oncology/oncology-search/oncology-search-entry'

export default async function OncologySearchPage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const { hos_id } = await props.params
  const cases = await getOncologyCases(hos_id)

  return (
    <div className="flex flex-col gap-4">
      <MobileTitle icon={SearchIcon} title="항암 케이스 검색" />
      <OncologySearchEntry cases={cases} hosId={hos_id} />
    </div>
  )
}

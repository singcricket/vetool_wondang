import MobileTitle from '@/components/common/mobile-title'
import CheckupSearchEntry from '@/components/hospital/checkup/checkup-search/checkup-search-entry'
import { getCheckupRecords } from '@/lib/services/checkup/fetch-checkup'
import { SearchIcon } from 'lucide-react'

export default async function CheckupSearchPage(
  props: PageProps<'/hospital/[hos_id]/checkup/[target_date]/search'>,
) {
  const { hos_id } = await props.params
  const checkupRecords = await getCheckupRecords(hos_id)

  return (
    <div className="flex flex-col gap-4">
      <MobileTitle icon={SearchIcon} title="건강검진 검색" />
      <CheckupSearchEntry checkupRecords={checkupRecords} hosId={hos_id} />
    </div>
  )
}

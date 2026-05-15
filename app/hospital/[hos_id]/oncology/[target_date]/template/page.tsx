import MobileTitle from '@/components/common/mobile-title'
import OncologyTemplateEntry from '@/components/hospital/oncology/oncology-template/oncology-template-entry'
import UpsertProtocolSheet from '@/components/hospital/oncology/oncology-template/upsert-protocol-sheet'
import { fetchHosProtocols } from '@/lib/actions/oncology/protocol-template-actions'
import { BookmarkIcon } from 'lucide-react'

export default async function OncologyTemplatePage(
  props: PageProps<'/hospital/[hos_id]/oncology/[target_date]/template'>,
) {
  const { hos_id } = await props.params
  const protocols = await fetchHosProtocols(hos_id)

  return (
    <div className="pb-16">
      <div className="flex items-center justify-between pr-4">
        <MobileTitle icon={BookmarkIcon} title="프로토콜 라이브러리" />
        <UpsertProtocolSheet mode="create" hosId={hos_id} />
      </div>

      <OncologyTemplateEntry protocols={protocols} hosId={hos_id} />
    </div>
  )
}

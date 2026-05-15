import { fetchOncologyCaseDetailAdmin } from '@/lib/services/oncology/fetch-oncology-case'
import SharedOwnerTabsClient from './shared-owner-tabs-client'

interface Props {
  resourceId: string
}

export default async function SharedOncologyOwnerView({ resourceId }: Props) {
  try {
    const detail = await fetchOncologyCaseDetailAdmin(resourceId)

    return (
      <div className="w-full max-w-2xl mx-auto">
        <SharedOwnerTabsClient detail={detail} />
      </div>
    )
  } catch (e: any) {
    return (
      <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
        <span className="font-bold text-red-500">케이스 정보를 불러올 수 없습니다.</span>
        <span className="text-xs">{e.message}</span>
      </div>
    )
  }
}

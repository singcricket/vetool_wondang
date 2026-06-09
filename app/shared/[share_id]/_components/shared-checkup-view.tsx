import { fetchCheckupReportAdmin } from '@/lib/services/checkup/fetch-checkup-report'
import CheckupReport from '@/components/hospital/checkup/checkup-report/checkup-report'

interface Props {
  resourceId: string
}

export default async function SharedCheckupView({ resourceId }: Props) {
  try {
    const data = await fetchCheckupReportAdmin(resourceId)
    return <CheckupReport data={data} />
  } catch (e: any) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-slate-500 shadow-sm flex flex-col gap-2">
        <span className="font-bold text-red-500">검진 정보를 불러올 수 없습니다.</span>
        <span className="text-xs">{e.message}</span>
      </div>
    )
  }
}

import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'

type Props = { msData: MsWithPatientWithWeight }

export default function MsReportVetComment({ msData }: Props) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">6. 수의사 소견</h2>
      <div className="rounded-md border border-gray-300 p-3 min-h-[80px] bg-gray-50/30">
        {msData.memo_etc ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msData.memo_etc}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">등록된 소견이 없습니다.</p>
        )}
      </div>
    </section>
  )
}

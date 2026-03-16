import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { format } from 'date-fns'

type Props = { msData: MsWithPatientWithWeight }

const TH = 'border border-gray-300 bg-gray-50 px-3 py-1.5 text-left text-xs font-semibold text-gray-600'
const TD = 'border border-gray-300 px-3 py-1.5 text-sm align-top'

export default function MsReportTreatment({ msData }: Props) {
  const memos = (msData.memo_tx as MsMemo[])
    .filter((m) => !m.is_realtime_memo)
    .sort((a, b) => {
      if (a.done_timestamp === null && b.done_timestamp === null) return 0
      if (a.done_timestamp === null) return 1
      if (b.done_timestamp === null) return -1
      return (
        new Date(a.done_timestamp).getTime() -
        new Date(b.done_timestamp).getTime()
      )
    })

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">3. 처치 정보</h2>
      {memos.length === 0 ? (
        <p className="text-xs text-muted-foreground">처치 정보 없음</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={TH}>처치 내용</th>
              <th className={`${TH} w-16 text-center`}>완료</th>
              <th className={`${TH} w-36`}>완료 시각</th>
            </tr>
          </thead>
          <tbody>
            {memos.map((m) => (
              <tr key={m.id}>
                <td className={TD} >
                  <span className="whitespace-pre-wrap">{m.memo}</span>
                </td>
                <td className={`${TD} text-center`}>{m.is_done ? '✓' : ''}</td>
                <td className={TD}>
                  {m.done_timestamp
                    ? format(new Date(m.done_timestamp), 'HH:mm')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

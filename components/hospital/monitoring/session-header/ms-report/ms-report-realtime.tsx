import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { differenceInMinutes, format } from 'date-fns'

type Props = { msData: MsWithPatientWithWeight }

const TH = 'border border-gray-300 bg-gray-50 px-3 py-1.5 text-left text-xs font-semibold text-gray-600'
const TD = 'border border-gray-300 px-3 py-1.5 text-sm align-top'

export default function MsReportRealtime({ msData }: Props) {
  const startTime = msData.start_time ? new Date(msData.start_time) : null

  const memos = (msData.memo_tx as MsMemo[])
    .filter((m) => m.done_timestamp !== null)
    .sort(
      (a, b) =>
        new Date(a.done_timestamp!).getTime() -
        new Date(b.done_timestamp!).getTime(),
    )

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">5. 실시간 타임테이블</h2>
      {memos.length === 0 ? (
        <p className="text-xs text-muted-foreground">완료된 실시간 메모 없음</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-32`}>시각</th>
              <th className={TH}>내용</th>
            </tr>
          </thead>
          <tbody>
            {memos.map((m) => {
              const doneTime = new Date(m.done_timestamp!)
              const elapsedMinutes = startTime
                ? differenceInMinutes(doneTime, startTime)
                : null

              return (
                <tr key={m.id}>
                  <td className={`${TD} whitespace-nowrap font-mono text-xs`}>
                    {format(doneTime, 'HH:mm')}
                    {elapsedMinutes !== null && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({elapsedMinutes >= 0 ? '+' : ''}
                        {elapsedMinutes}분)
                      </span>
                    )}
                  </td>
                  <td
                    className={TD}
                    // style={{ borderLeftWidth: 3 }}
                  >
                    <span className="whitespace-pre-wrap">{m.memo}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}

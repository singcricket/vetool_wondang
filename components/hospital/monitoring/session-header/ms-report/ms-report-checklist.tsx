import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { VitalTimeSlot } from '@/types/monitoring/monitoring-type'
import { addMinutes, format, isValid } from 'date-fns'

type Props = { msData: MsWithPatientWithWeight }

const TH = 'border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-center text-gray-600 whitespace-nowrap'
const TDtime = 'border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-600 whitespace-nowrap text-center'
const TD = 'border border-gray-300 px-2 py-1.5 text-xs text-center'

function slotLabel(slot: VitalTimeSlot, startTime: string | null): string {
  const min = Number(slot.minTime)
  const elapsed = `+${min}분`
  if (!startTime) return elapsed
  const base = new Date(startTime)
  if (!isValid(base)) return elapsed
  const actual = addMinutes(base, min)
  return `${elapsed} (${format(actual, 'HH:mm')})`
}

export default function MsReportChecklist({ msData }: Props) {
  const slots: VitalTimeSlot[] = (msData.vital_results ?? []).slice().sort(
    (a, b) => Number(a.minTime) - Number(b.minTime),
  )

  if (slots.length === 0)
    return (
      <section>
        <h2 className="mb-2 text-sm font-bold">4. 체크리스트</h2>
        <p className="text-xs text-muted-foreground">측정 데이터 없음</p>
      </section>
    )

  // 가로축: 모든 측정 항목 이름 (등장 순서 기준)
  const vitalNamesSet = new Set<string>()
  slots.forEach((s) => s.vitals.forEach((v) => vitalNamesSet.add(v.vitalName)))
  const vitalNames = Array.from(vitalNamesSet)

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">4. 체크리스트</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {/* 첫 번째 헤더: 시간 열 제목 */}
              <th className={TH}>시간</th>
              {/* 가로축: 측정 항목 */}
              {vitalNames.map((name) => (
                <th key={name} className={TH}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 세로축: 시간대별 측정 결과 */}
            {slots.map((slot) => (
              <tr key={slot.minTime}>
                <td className={TDtime}>
                  {slotLabel(slot, msData.start_time)}
                </td>
                {vitalNames.map((name) => {
                  const entry = slot.vitals.find((v) => v.vitalName === name)
                  return (
                    <td key={name} className={TD}>
                      {entry?.value || '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

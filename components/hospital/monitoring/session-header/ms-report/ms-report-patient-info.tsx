import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { differenceInDays } from 'date-fns'

type Props = { msData: MsWithPatientWithWeight }

function ageDisplay(birth: string | null): string {
  if (!birth) return '-'
  const days = differenceInDays(new Date(), new Date(birth))
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  if (years > 0) return `${years}세 ${months}개월`
  return `${months}개월`
}

const ROW = 'border border-gray-300'
const TH = 'border border-gray-300 bg-gray-50 px-3 py-1.5 text-left text-xs font-semibold text-gray-600 w-28'
const TD = 'border border-gray-300 px-3 py-1.5 text-sm'

export default function MsReportPatientInfo({ msData }: Props) {
  const p = msData.patient
  if (!p) return <p className="text-xs text-muted-foreground">환자 정보 없음</p>

  const rows: [string, string][] = [
    ['환자 이름', p.name ?? '-'],
    ['종 (Species)', p.species ?? '-'],
    ['품종 (Breed)', p.breed ?? '-'],
    ['성별', p.gender ?? '-'],
    ['생년월일', p.birth ?? '-'],
    ['연령', ageDisplay(p.birth ?? null)],
    ['체중', p.body_weight ? `${p.body_weight} kg` : '-'],
    ['환자 번호', p.hos_patient_id ?? '-'],
  ]

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">1. 환자 정보</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className={ROW}>
              <th className={TH}>{label}</th>
              <td className={TD}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

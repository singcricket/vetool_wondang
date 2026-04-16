import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = {
  chartDetail: DentalChartDetail
  hosId: string
  targetDate: string
}

function calcAge(birth: string | null): string {
  if (!birth) return '나이 미상'
  const today = new Date()
  const b = new Date(birth)
  const years = today.getFullYear() - b.getFullYear()
  const months = today.getMonth() - b.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}개월`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`
}

export default function DentalChartHeader({ chartDetail, hosId, targetDate }: Props) {
  const { patient, chart_date } = chartDetail
  const speciesLabel =
    patient.species === 'canine' || patient.species === 'dog'
      ? '🐶 개'
      : patient.species === 'feline' || patient.species === 'cat'
        ? '🐱 고양이'
        : patient.species

  return (
    <header className="sticky top-0 z-40 flex min-h-12 items-center justify-between gap-4 border-b bg-background px-4 py-2">
      {/* 환자 정보 */}
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-foreground">{patient.name}</span>
        <span className="text-sm text-muted-foreground">{speciesLabel}</span>
        {patient.breed && (
          <span className="text-sm text-muted-foreground">· {patient.breed}</span>
        )}
        <span className="text-sm text-muted-foreground">· {calcAge(patient.birth)}</span>
        {patient.hos_patient_id && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
            {patient.hos_patient_id}
          </span>
        )}
      </div>

      {/* 차트 날짜 */}
      <div className="text-sm font-medium text-muted-foreground">
        {chart_date}
      </div>
    </header>
  )
}

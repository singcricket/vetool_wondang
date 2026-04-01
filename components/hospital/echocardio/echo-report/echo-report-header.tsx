import { format, parseISO } from 'date-fns'
import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'

interface EchoReportHeaderProps {
  chartDetail: EchoChartDetail
}

export default function EchoReportHeader({ chartDetail }: EchoReportHeaderProps) {
  const { patient, vet, examiner, exam_date } = chartDetail

  return (
    <div className="flex flex-col gap-4 border-b-2 border-primary/20 pb-4">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold tracking-tight text-primary uppercase">Echocardiography Report</h1>
        <div className="text-right text-xs text-muted-foreground">
          <p>검사 일시: {format(parseISO(exam_date), 'yyyy-MM-dd')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg bg-muted/20 p-4 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <span className="w-16 font-semibold text-muted-foreground text-[10px]">환자명</span>
            <span className="font-bold">{patient.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 font-semibold text-muted-foreground text-[10px]">품종/종</span>
            <span>{patient.breed} ({patient.species})</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="w-16 font-semibold text-muted-foreground">차트번호</span>
            <span>{patient.hos_patient_id}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <span className="w-16 font-semibold text-muted-foreground text-[10px]">담당수의사</span>
            <span>{vet?.name || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 font-semibold text-muted-foreground text-[10px]">검사자</span>
            <span>{examiner?.name || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsReportPatientInfo from './ms-report-patient-info'
import MsReportVetInfo from './ms-report-vet-info'
import MsReportTreatment from './ms-report-treatment'
import MsReportChecklist from './ms-report-checklist'
import MsReportRealtime from './ms-report-realtime'
import MsReportVetComment from './ms-report-vet-comment'
import { differenceInMinutes, format } from 'date-fns'

type Props = {
  msData: MsWithPatientWithWeight
}

export default function MsReport({ msData }: Props) {
  const patientName = msData.patient?.name ?? '미지정 환자'
  const reportDate = msData.due_date
    ? format(new Date(msData.due_date), 'yyyy년 MM월 dd일')
    : '-'

  const startTime = msData.start_time ? new Date(msData.start_time) : null
  const endTime = msData.end_time ? new Date(msData.end_time) : null

  const startLabel = startTime ? format(startTime, 'HH:mm') : '-'
  const endLabel = endTime ? format(endTime, 'HH:mm') : '-'
  const durationLabel =
    startTime && endTime
      ? (() => {
          const total = differenceInMinutes(endTime, startTime)
          const h = Math.floor(total / 60)
          const m = total % 60
          return h > 0 ? `${h}시간 ${m}분` : `${m}분`
        })()
      : '-'

  return (
    <div className="flex flex-col gap-6 text-sm ">
      {/* 타이틀 */}
      <div className="border-b pb-3 text-center">
        <h1 className="text-lg font-bold">{msData.session_title} 리포트</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {patientName} · {reportDate}
        </p>
      </div>

      {/* 시간 정보 */}
      <section className="grid grid-cols-2 gap-2 rounded-lg border  p-3 sm:grid-cols-4">
        {[
          ['날짜', reportDate],
          ['시작 시간', startLabel],
          ['종료 시간', endLabel],
          ['총 소요 시간', durationLabel],
        ].map(([label, value], idx) => (
          <div key={label} className={`flex flex-col items-center justify-center gap-0.5 ${idx !==3 ? 'border-r' : 'border-r-0'}`}>
             <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
             <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </section>

      {/* 1. 환자 정보 */}
      <MsReportPatientInfo msData={msData} />

      {/* 2. 수의사 정보 */}
      <MsReportVetInfo msData={msData} />

      {/* 3. 처치 정보 */}
      <MsReportTreatment msData={msData} />

      {/* 4. 체크리스트 */}
      <MsReportChecklist msData={msData} />

      {/* 5. 실시간 타임테이블 */}
      <MsReportRealtime msData={msData} />

      {/* 6. 수의사 소견 */}
      <MsReportVetComment msData={msData} />
    </div>
  )
}
'use client'

import { useRef } from 'react'
import { format, parseISO } from 'date-fns'
import type { EchoChartDetail, EchoResultMap } from '@/types/echocardio/echocardio-type'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import EchoReportExport from './echo-report-export'

interface EchoReportProps {
  chartDetail: EchoChartDetail
  resultMap: EchoResultMap
  computedResults: Record<string, { result: string; comment: string }>
}

export default function EchoReport({
  chartDetail,
  resultMap,
  computedResults,
}: EchoReportProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const { patient, vet, examiner, exam_date } = chartDetail

  // 이상 소견 수집 (comment가 있고 normal이 아닌 항목)
  const findings = chartDetail.results
    .filter((r) => {
      const c = computedResults[r.keyword_id]
      return (
        c?.comment &&
        c.comment.toLowerCase() !== 'normal' &&
        c.comment !== ''
      )
    })
    .map((r) => ({
      keyword_id: r.keyword_id,
      value: r.value ?? '',
      result: computedResults[r.keyword_id]?.result ?? '',
      comment: computedResults[r.keyword_id]?.comment ?? '',
    }))

  return (
    <div className="flex flex-col gap-4">
      {/* 출력 버튼 */}
      <div className="flex justify-end gap-2">
        <EchoReportExport reportRef={reportRef} patientName={patient.name} />
      </div>

      {/* 리포트 본문 */}
      <div
        ref={reportRef}
        className="flex flex-col gap-4 rounded-md border bg-white p-6"
      >
        {/* 헤더 */}
        <div className="border-b pb-3">
          <h2 className="text-base font-bold">심장초음파 검사 결과</h2>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              환자:{' '}
              <strong className="text-foreground">{patient.name}</strong>
            </span>
            <span>
              차트번호:{' '}
              <strong className="text-foreground">
                {patient.hos_patient_id}
              </strong>
            </span>
            <span>
              {patient.species} · {patient.breed}
            </span>
            <span>검사일: {format(parseISO(exam_date), 'yyyy년 MM월 dd일')}</span>
            {vet && <span>담당의: {vet.name}</span>}
            {examiner && <span>검사자: {examiner.name}</span>}
          </div>
        </div>

        {/* 이상 소견 요약 */}
        {findings.length > 0 ? (
          <div>
            <h3 className="mb-2 text-xs font-bold">이상 소견</h3>
            <ul className="flex flex-col gap-1">
              {findings.map((f) => (
                <li key={f.keyword_id} className="flex gap-2 text-xs">
                  <span className="text-red-500">•</span>
                  <span>{f.comment}</span>
                  {f.value && (
                    <span className="text-muted-foreground">({f.value})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            이상 소견 없음 (정상 범위)
          </p>
        )}

        {/* 전체 결과 표 */}
        <div>
          <h3 className="mb-2 text-xs font-bold">전체 검사 결과</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="border px-2 py-1 text-left text-[10px] font-semibold">
                  항목
                </th>
                <th className="border px-2 py-1 text-center text-[10px] font-semibold">
                  측정값
                </th>
                <th className="border px-2 py-1 text-center text-[10px] font-semibold">
                  판정
                </th>
                <th className="border px-2 py-1 text-left text-[10px] font-semibold">
                  소견
                </th>
              </tr>
            </thead>
            <tbody>
              {chartDetail.results
                .filter((r) => r.value)
                .map((r) => {
                  const c = computedResults[r.keyword_id]
                  const isAbnormal =
                    c?.result &&
                    c.result !== 'normal' &&
                    c.result !== 'Normal' &&
                    c.result !== ''
                  return (
                    <tr
                      key={r.keyword_id}
                      className={isAbnormal ? 'bg-red-50/50' : ''}
                    >
                      <td className="border px-2 py-1 text-[10px] text-muted-foreground">
                        {r.keyword_id}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {r.value}
                      </td>
                      <td className="border px-2 py-1 text-center text-[10px]">
                        <span
                          className={
                            isAbnormal ? 'text-red-600' : 'text-green-700'
                          }
                        >
                          {c?.result || '—'}
                        </span>
                      </td>
                      <td className="border px-2 py-1 text-[10px] text-muted-foreground">
                        {c?.comment || '—'}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* 종합 소견 */}
        {chartDetail.memo && (
          <div>
            <h3 className="mb-1 text-xs font-bold">종합 소견</h3>
            <p className="whitespace-pre-wrap text-xs">{chartDetail.memo}</p>
          </div>
        )}
      </div>
    </div>
  )
}

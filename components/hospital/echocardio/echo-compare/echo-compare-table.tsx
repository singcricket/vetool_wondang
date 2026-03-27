'use client'

import { format, parseISO } from 'date-fns'
import type {
  EchoChartDetail,
  EchoChartWithPatient,
  EchoTestUIMeta,
} from '@/types/echocardio/echocardio-type'

interface EchoCompareTableProps {
  current: EchoChartDetail
  history: EchoChartWithPatient[]
  testUIMeta: EchoTestUIMeta[]
}

export default function EchoCompareTable({
  current,
  history,
  testUIMeta,
}: EchoCompareTableProps) {
  if (history.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        이전 검사 기록이 없습니다
      </div>
    )
  }

  // 현재 차트 결과값 맵
  const currentMap: Record<string, string> = {}
  current.results.forEach((r) => {
    if (r.value) currentMap[r.keyword_id] = r.value
  })

  // 값이 존재하는 항목만 표시
  const activeKeywords = testUIMeta.filter(
    (m) =>
      m.testType !== 'textcomment' &&
      (currentMap[m.keywordID] ||
        history.some((h: any) =>
          h.echo_results?.some(
            (r: any) => r.keyword_id === m.keywordID && r.value,
          ),
        )),
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 border bg-muted/50 px-2 py-1.5 text-left text-[10px] font-semibold text-muted-foreground">
              항목
            </th>
            {/* 현재 차트 */}
            <th className="border bg-blue-50 px-2 py-1.5 text-center text-[10px] font-semibold text-blue-700">
              {format(parseISO(current.exam_date), 'yy.MM.dd')} (현재)
            </th>
            {/* 이전 차트들 */}
            {history.map((h) => (
              <th
                key={h.id}
                className="border px-2 py-1.5 text-center text-[10px] font-semibold text-muted-foreground"
              >
                {format(parseISO(h.exam_date), 'yy.MM.dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeKeywords.map((meta) => (
            <tr key={meta.keywordID} className="hover:bg-muted/30">
              <td className="sticky left-0 border bg-white px-2 py-1 text-[10px] text-muted-foreground">
                {meta.keywordName}
                {meta.unit && (
                  <span className="ml-0.5 text-[9px]">({meta.unit})</span>
                )}
              </td>
              {/* 현재 값 */}
              <td className="border bg-blue-50/30 px-2 py-1 text-center">
                <CellValue
                  value={currentMap[meta.keywordID]}
                />
              </td>
              {/* 이전 값들 */}
              {history.map((h: any) => {
                const res = h.echo_results?.find(
                  (r: any) => r.keyword_id === meta.keywordID,
                )
                return (
                  <td key={h.id} className="border px-2 py-1 text-center">
                    <CellValue value={res?.value} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CellValue({ value }: { value?: string | null }) {
  if (!value)
    return <span className="text-[10px] text-muted-foreground">—</span>
  return <span className="text-xs">{value}</span>
}

'use client'

import { format, parseISO } from 'date-fns'
import type {
  EchoChartDetail,
  EchoTestUIMeta,
  EchoTemplate,
  EchoSection,
} from '@/types/echocardio/echocardio-type'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { LAYOUT_CANINE, LAYOUT_FELINE } from '@/constants/hospital/echocardio/echo-layouts'

interface EchoCompareTableProps {
  current: EchoChartDetail
  history: EchoChartDetail[]
  testUIMeta: EchoTestUIMeta[]
  settings: EchoTemplate
}

export default function EchoCompareTable({
  current,
  history,
  testUIMeta,
  settings,
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

  const species =
    current.patient.species?.toLowerCase() === 'cat' ||
    current.patient.species?.toLowerCase() === 'feline'
      ? 'feline'
      : 'canine'

  // 섹션 순서 결정 (입력 모드와 동일한 로직)
  const speciesLayout = species === 'feline' ? LAYOUT_FELINE : LAYOUT_CANINE
  const speciesAllowedSections = new Set(speciesLayout.sections.map((s) => s.sectionID))
  const sectionOrderFromSettings = (settings?.section_order as EchoSection[]) || []
  const speciesDefaultOrder = speciesLayout.sections.map((s) => s.sectionID) as EchoSection[]
  
  const targetSectionsOrder = Array.from(
    new Set([...sectionOrderFromSettings, ...speciesDefaultOrder]),
  ).filter((s) => speciesAllowedSections.has(s))

  // 값이 하나라도 존재하는지 확인하는 헬퍼
  const hasValueAcrossHistoryArr = (keywordID: string) => {
    return !!(currentMap[keywordID] || history.some(h => h.results?.some(r => r.keyword_id === keywordID && r.value)))
  }

  // 현재 차트와 히스토리를 합쳐서 날짜순(최신순)으로 정렬
  const allCharts = [current, ...history].sort((a, b) => {
    return parseISO(b.exam_date).getTime() - parseISO(a.exam_date).getTime()
  })

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* 종합 소견 비교 섹션 */}
      <div className="flex flex-col gap-2">
        <h3 className="border-l-4 border-blue-500 pl-2 text-sm font-bold text-slate-700">
          종합 소견 및 약물
        </h3>
        <div className="overflow-x-auto rounded border border-slate-200 shadow-sm bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-10 border-b border-r bg-slate-50 px-2 py-2 text-left text-xs font-bold text-slate-500 w-[110px] shrink-0">
                  항목
                </th>
                {allCharts.map((chart) => {
                  const isCurrent = chart.id === current.id
                  return (
                    <th
                      key={chart.id}
                      className={`border-b px-3 py-2 text-center text-xs font-bold shrink-0 w-24 ${
                        isCurrent ? 'bg-blue-50 text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {format(parseISO(chart.exam_date), 'yy.MM.dd')}
                      {isCurrent && <span className="ml-1 text-[9px] opacity-80">(현재)</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sticky left-0 z-10 border-r bg-white px-2 py-3 text-xs font-medium text-slate-600">
                  General Review
                </td>
                {allCharts.map((chart) => {
                  const isCurrent = chart.id === current.id
                  return (
                    <td 
                      key={chart.id} 
                      className={`px-3 py-3 text-left align-top w-24 shrink-0 ${isCurrent ? 'bg-blue-50/10' : ''}`}
                    >
                      <p className={`whitespace-pre-wrap ${isCurrent ? 'text-xs font-medium text-blue-900' : 'text-xs text-slate-600'}`}>
                        {chart.memo || <span className="text-slate-300">—</span>}
                      </p>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {targetSectionsOrder.map((sectionId) => {
        // 해당 섹션의 아이템들 중 값이 하나라도 존재하는 것들 필터링
        const items = testUIMeta.filter(m => 
          m.sections.includes(sectionId as EchoSection) && 
          m.species.includes(species) &&
          m.testType !== 'textcomment' &&
          hasValueAcrossHistoryArr(m.keywordID)
        )

        // 템플릿 설정의 아이템 순서대로 정렬
        const itemOrder = settings?.item_order?.[sectionId]
        const sortedItems = itemOrder 
          ? [...items].sort((a, b) => {
              const ai = itemOrder.indexOf(a.keywordID)
              const bi = itemOrder.indexOf(b.keywordID)
              if (ai === -1) return 1
              if (bi === -1) return -1
              return ai - bi
            })
          : items

        if (sortedItems.length === 0) return null

        return (
          <div key={sectionId} className="flex flex-col gap-2">
            <h3 className="border-l-4 border-blue-500 pl-2 text-sm font-bold text-slate-700">
              {ECHO_SECTION_META[sectionId as EchoSection]?.label ?? sectionId}
            </h3>
            <div className="overflow-x-auto rounded border border-slate-200 shadow-sm bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 z-10 border-b border-r bg-slate-50 px-2 py-2 text-left text-xs font-bold text-slate-500 w-[110px] shrink-0">
                      항목
                    </th>
                    {/* 통합 정렬된 컬럼 헤더 */}
                    {allCharts.map((chart) => {
                      const isCurrent = chart.id === current.id
                      return (
                        <th
                          key={chart.id}
                          className={`border-b px-3 py-2 text-center text-xs font-bold shrink-0 w-24 ${
                            isCurrent ? 'bg-blue-50 text-blue-700' : 'text-slate-400'
                          }`}
                        >
                          {format(parseISO(chart.exam_date), 'yy.MM.dd')}
                          {isCurrent && <span className="ml-1 text-[9px] opacity-80">(현재)</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedItems.map((meta) => (
                    <tr key={meta.keywordID} className="hover:bg-slate-50/50">
                      <td className="sticky left-0 z-10 border-r bg-white px-2 py-1.5 text-xs font-medium text-slate-600">
                        {meta.keywordName}
                        {meta.unit && (
                          <span className="ml-0.5 text-[10px] text-slate-400">({meta.unit})</span>
                        )}
                      </td>
                      {/* 통합 정렬된 컬럼 값 */}
                      {allCharts.map((chart) => {
                        const isCurrent = chart.id === current.id
                        const res = chart.results?.find(
                          (r: any) => r.keyword_id === meta.keywordID,
                        )
                        return (
                          <td 
                            key={chart.id} 
                            className={`px-3 py-1.5 text-center ${isCurrent ? 'bg-blue-50/10' : ''}`}
                          >
                            <CellValue value={res?.value} isHighlighted={isCurrent} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CellValue({ value, isHighlighted = false }: { value?: string | null; isHighlighted?: boolean }) {
  if (!value)
    return <span className="text-xs text-slate-300">—</span>
  return (
    <span className={`${isHighlighted ? 'text-sm font-bold text-blue-800' : 'text-xs text-slate-700'}`}>
      {value}
    </span>
  )
}

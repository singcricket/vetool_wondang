'use client'

import { useRef, useState, useMemo } from 'react'
import type { EchoChartDetail, EchoResultMap, Species, EchoSection } from '@/types/echocardio/echocardio-type'
import { ECHO_SECTION_META, DEFAULT_SECTION_ORDER } from '@/constants/hospital/echocardio/echo-sections'
import { getEchoTestsBySpecies } from '@/constants/hospital/echocardio/echo-tests'
import { LAYOUT_CANINE, LAYOUT_FELINE } from '@/constants/hospital/echocardio/echo-layouts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Sub-components
import EchoReportExport from './echo-report-export'
import EchoReportHeader from './echo-report-header'
import EchoReportTable from './echo-report-table'
import EchoReportSummary from './echo-report-summary'
import EchoReportFooter from './echo-report-footer'

interface EchoReportProps {
  chartDetail: EchoChartDetail
  resultMap: EchoResultMap
  computedResults: Record<string, { result: string; comment: string }>
}

type ReportMode = 'section' | 'functional' | 'anatomic'

export default function EchoReport({
  chartDetail,
  resultMap,
  computedResults,
}: EchoReportProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<ReportMode>('section')
  const { patient, exam_date } = chartDetail

  const species = (patient.species?.toLowerCase() === 'feline' ? 'feline' : 'canine') as Species
  const testDefinitions = useMemo(() => getEchoTestsBySpecies(species), [species])

  // 데이터 그룹화 로직
  const reportData = useMemo(() => {
    // 기본적으로 값이 있는 것들만 표시
    const results = chartDetail.results.filter((r) => r.value)
    const speciesLayout = species === 'feline' ? LAYOUT_FELINE : LAYOUT_CANINE
    const allowedSections = new Set(speciesLayout.sections.map((s) => s.sectionID))
    const sectionLabels = Object.fromEntries(speciesLayout.sections.map((s) => [s.sectionID, s.label]))

    // 항상 노출해야 하는 항목들 (종별 레이아웃에 포함된 섹션만)
    const GLOBAL_ALWAYS_EXPOSED = ['General_Review']
    const alwaysExposedSections = GLOBAL_ALWAYS_EXPOSED.filter(sec => allowedSections.has(sec))
    
    const alwaysExposedItems: any[] = []
    
    Object.values(testDefinitions).forEach(test => {
      if (test.sections?.some(sec => alwaysExposedSections.includes(sec))) {
        // 이미 results에 포함되어 있는지 확인 (중복 방지)
        if (!results.some(r => r.keyword_id === test.keywordID)) {
          alwaysExposedItems.push({
            keyword_id: test.keywordID,
            value: resultMap[test.keywordID] || null,
            meta: test,
            computed: computedResults[test.keywordID]
          })
        }
      }
    })

    const bySection: Record<string, { label: string; items: any[] }> = {}
    const byFunctional: Record<string, { label: string; items: any[] }> = {}
    const byAnatomic: Record<string, { label: string; items: any[] }> = {}

    // 값 있는 항목들 처리
    results.forEach((r) => {
      const meta = testDefinitions[r.keyword_id]
      if (!meta) return

      const item = {
        keyword_id: r.keyword_id,
        value: r.value,
        meta,
        computed: computedResults[r.keyword_id]
      }
      
      processItem(item)
    })

    // 항상 노출 항목들 처리
    alwaysExposedItems.forEach(processItem)

    function processItem(item: any) {
      const { meta } = item
      // 섹션별 그룹화
      meta.sections?.forEach((sec: EchoSection) => {
        if (!allowedSections.has(sec)) return

        if (!bySection[sec]) {
          bySection[sec] = { 
            label: sectionLabels[sec] || ECHO_SECTION_META[sec]?.label || sec, 
            items: [] 
          }
        }
        // 중복 방지
        if (!bySection[sec].items.some(it => it.keyword_id === item.keyword_id)) {
          bySection[sec].items.push(item)
        }
      })

      // 기능별 그룹화
      meta.functional_groups?.forEach((func: string) => {
        if (!byFunctional[func]) {
          byFunctional[func] = { 
            label: func.replace(/_/g, ' '), 
            items: [] 
          }
        }
        if (!byFunctional[func].items.some(it => it.keyword_id === item.keyword_id)) {
          byFunctional[func].items.push(item)
        }
      })

      // 구조별 그룹화
      meta.anatomic_groups?.forEach((anat: string) => {
        if (!byAnatomic[anat]) {
          byAnatomic[anat] = { 
            label: anat.replace(/_/g, ' '), 
            items: [] 
          }
        }
        if (!byAnatomic[anat].items.some(it => it.keyword_id === item.keyword_id)) {
          byAnatomic[anat].items.push(item)
        }
      })
    }

    return { bySection, byFunctional, byAnatomic }
  }, [chartDetail.results, testDefinitions, computedResults, resultMap, species])

  // 섹션 뷰의 경우 정의된 순서대로 정렬
  const sortedSections = useMemo(() => {
    const defaultOrder = (species === 'feline' ? LAYOUT_FELINE : LAYOUT_CANINE).sections.map(
      (s: any) => s.sectionID as EchoSection,
    )
    return defaultOrder.filter((sec: EchoSection) => reportData.bySection[sec])
  }, [reportData.bySection, species])

  return (
    <div className="flex flex-col gap-4">
      {/* 뷰 선택 탭 (화면용) */}
      <div className="flex items-center justify-between print:hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportMode)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="section">섹션별</TabsTrigger>
            <TabsTrigger value="functional">기능별</TabsTrigger>
            <TabsTrigger value="anatomic">구조별</TabsTrigger>
          </TabsList>
        </Tabs>
        <EchoReportExport 
          reportRef={reportRef} 
          patientName={patient.name} 
          chartDetail={chartDetail}
          resultMap={resultMap}
          computedResults={computedResults}
          testDefinitions={testDefinitions}
          sortedSections={sortedSections}
          reportData={reportData}
        />
      </div>

      {/* 리포트 본문 (출력 영역) */}
      <div
        ref={reportRef}
        className="flex flex-col gap-6 rounded-md border bg-white p-8 shadow-sm print:border-none print:p-0 print:shadow-none"
      >
        {/* 헤더 */}
        <EchoReportHeader chartDetail={chartDetail} />

        {/* 본문: 그룹별 테이블 */}
        <div className="flex flex-col gap-8">
          {activeTab === 'section' && sortedSections.map((sec: EchoSection) => (
            <EchoReportTable 
              key={sec} 
              label={reportData.bySection[sec].label} 
              items={reportData.bySection[sec].items} 
              bwKg={parseFloat(resultMap['BW_kg'] || '0')}
              species={species}
            />
          ))}

          {activeTab === 'functional' && Object.entries(reportData.byFunctional).map(([key, group]) => (
            <EchoReportTable 
              key={key} 
              label={group.label} 
              items={group.items} 
              isUppercase 
              bwKg={parseFloat(resultMap['BW_kg'] || '0')}
              species={species}
            />
          ))}

          {activeTab === 'anatomic' && Object.entries(reportData.byAnatomic).map(([key, group]) => (
            <EchoReportTable 
              key={key} 
              label={group.label} 
              items={group.items} 
              isUppercase 
              bwKg={parseFloat(resultMap['BW_kg'] || '0')}
              species={species}
            />
          ))}
        </div>

        {/* 종합 소견 */}
        <EchoReportSummary memo={chartDetail.memo} />

        {/* 푸터 */}
        <EchoReportFooter />
      </div>
    </div>
  )
}

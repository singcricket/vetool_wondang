'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import type {
  EchoChartDetail,
  EchoChartWithPatient,
  EchoGuideImage,
  EchoResultMap,
  EchoSection,
} from '@/types/echocardio/echocardio-type'
import { useEchoContext } from '@/providers/echo-context-provider'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { upsertEchoResult, updateCalculatedResults } from '@/lib/services/echocardio/update-echo'
import { getMmodeRef } from '@/constants/hospital/echocardio/mmode-ref-dog'
import EchoChartHeader from './echo-chart-header'
import EchoSectionWrapper from '../echo-sections/echo-section-wrapper'
import EchoCompareTable from '../echo-compare/echo-compare-table'
import EchoReport from '../echo-report/echo-report'
import EchoGuidePanel from '../echo-guide/echo-guide-panel'

interface EchoChartViewProps {
  chartDetail: EchoChartDetail
  history: EchoChartWithPatient[]
  guideImages: EchoGuideImage[]
  hosId: string
}

type Tab = 'input' | 'compare' | 'report'

export default function EchoChartView({
  chartDetail,
  history,
  guideImages,
  hosId,
}: EchoChartViewProps) {
  const { echoContextData, resultMap, setResultMap, updateResult } =
    useEchoContext()
  const { settings, testUIMeta } = echoContextData

  const [activeTab, setActiveTab] = useState<Tab>('input')
  const [isSaving, startSaving] = useTransition()
  const [pendingSave, setPendingSave] = useState<Set<string>>(new Set())

  // 차트 로드 시 결과값 초기화
  useEffect(() => {
    const map: EchoResultMap = {}
    chartDetail.results.forEach((r) => {
      if (r.value !== null) map[r.keyword_id] = r.value
    })
    setResultMap(map)
  }, [chartDetail.id, setResultMap])

  // 현재 체중 (M-mode 참조범위 계산용)
  const bwKg = parseFloat(resultMap['BW_kg'] ?? '0')

  // M-mode 참조범위 맵 (체중 기반)
  const mmodeRefs: Record<string, [number, number] | null> = {}
  if (bwKg > 0) {
    ;['VSd', 'LVd', 'LVWd', 'VSs', 'LVs', 'LVWs', 'LA', 'AO'].forEach(
      (id) => {
        mmodeRefs[id] = getMmodeRef(bwKg, id)
      },
    )
  }

  // 서버에서 계산된 결과값 (result, comment)
  const computedResults: Record<string, { result: string; comment: string }> =
    {}
  chartDetail.results.forEach((r) => {
    computedResults[r.keyword_id] = {
      result: r.result ?? '',
      comment: r.comment ?? '',
    }
  })

  // 항목 변경 핸들러 (debounce 후 저장)
  const handleItemChange = useCallback(
    (keywordId: string, value: string) => {
      updateResult(keywordId, value)
      setPendingSave((prev) => new Set(prev).add(keywordId))
    },
    [updateResult],
  )

  // 저장 핸들러
  function handleSave() {
    startSaving(async () => {
      const allValues = { ...resultMap }
      const saves = Array.from(pendingSave)
      for (const keywordId of saves) {
        const value = allValues[keywordId] ?? ''
        await upsertEchoResult({
          echoChartId: chartDetail.id,
          keywordId,
          value,
          allValues,
        })
        await updateCalculatedResults({
          echoChartId: chartDetail.id,
          changedKeywordId: keywordId,
          allValues,
        })
      }
      setPendingSave(new Set())
    })
  }

  // 섹션 순서 및 활성 항목 적용
  const sectionOrder = settings.section_order
  const activeItems = settings.active_items

  // 섹션별 UI 메타 필터링 및 순서 적용
  function getSectionItems(section: EchoSection) {
    const activeIds = activeItems[section]
    const sectionMeta = testUIMeta.filter((m) => m.section === section)

    const filtered = activeIds
      ? sectionMeta.filter((m) => activeIds.includes(m.keywordID))
      : sectionMeta

    // 사용자 정의 순서 적용
    const order = settings.item_order[section]
    if (!order || order.length === 0) return filtered

    return [...filtered].sort((a, b) => {
      const ai = order.indexOf(a.keywordID)
      const bi = order.indexOf(b.keywordID)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'input', label: '검사 입력' },
    { key: 'compare', label: '비교' },
    { key: 'report', label: '리포트' },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <EchoChartHeader
        chartDetail={chartDetail}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {/* 탭 */}
      <div className="flex items-center gap-0 border-b bg-white px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 text-xs transition-colors ${
              activeTab === t.key
                ? 'border-b-2 border-black font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.key === 'input' && pendingSave.size > 0 && (
              <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {activeTab === 'input' && (
          <div className="flex flex-1 gap-4 overflow-hidden">
            {/* 가이드 이미지 패널 */}
            {guideImages.length > 0 && (
              <div className="w-64 shrink-0 overflow-y-auto border-r p-3">
                <EchoGuidePanel
                  images={guideImages}
                  highlightedKeywords={Object.keys(resultMap)}
                />
              </div>
            )}

            {/* 검사 입력 영역 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {sectionOrder.map((section) => {
                  const items = getSectionItems(section)
                  if (items.length === 0) return null
                  return (
                    <EchoSectionWrapper
                      key={section}
                      sectionLabel={
                        ECHO_SECTION_META[section]?.label ?? section
                      }
                      items={items}
                      resultMap={resultMap}
                      computedResults={computedResults}
                      mmodeRefs={mmodeRefs}
                      onItemChange={handleItemChange}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="flex-1 overflow-auto p-4">
            <EchoCompareTable
              current={chartDetail}
              history={history}
              testUIMeta={testUIMeta}
            />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="flex-1 overflow-auto p-4">
            <EchoReport
              chartDetail={chartDetail}
              resultMap={resultMap}
              computedResults={computedResults}
            />
          </div>
        )}
      </div>
    </div>
  )
}

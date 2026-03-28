'use client'

import { useState, useEffect, useTransition, useCallback, useRef, startTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import EchoSectionWrapper from '../echo-sections/echo-section-wrapper'
import EchoCompareTable from '../echo-compare/echo-compare-table'
import EchoReport from '../echo-report/echo-report'
import EchoGuidePanel from '../echo-guide/echo-guide-panel'
import EchoInfoContainer from '../echo-info/echo-info-container'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

interface EchoChartBodyProps {
  chartDetail: EchoChartDetail
  history: EchoChartWithPatient[]
  guideImages: EchoGuideImage[]
  hosId: string
}

type Tab = 'input' | 'compare' | 'report'

const TABS: { key: Tab; label: string }[] = [
  { key: 'input', label: '검사 입력' },
  { key: 'compare', label: '비교' },
  { key: 'report', label: '리포트' },
]

export default function EchoChartBody({
  chartDetail,
  history,
  guideImages,
  hosId,
}: EchoChartBodyProps) {
  const { echoContextData, resultMap, setResultMap, updateResult } = useEchoContext()
  const { settings, testUIMeta } = echoContextData
  const { refresh } = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('input')
  const [isSaving, startSaving] = useTransition()
  const [pendingSave, setPendingSave] = useState<Set<string>>(new Set())

  const pendingSaveRef = useRef<Set<string>>(new Set())
  const resultMapRef = useRef<EchoResultMap>({})

  useEffect(() => { pendingSaveRef.current = pendingSave }, [pendingSave])
  useEffect(() => { resultMapRef.current = resultMap }, [resultMap])

  // results의 실제 내용이 바뀔 때만 재초기화 (저장 중이면 덮어쓰지 않음)
  const resultsKey = chartDetail.results
    .map((r) => `${r.keyword_id}:${r.value ?? ''}`)
    .join(',')

  useEffect(() => {
    if (pendingSaveRef.current.size > 0) return
    const map: EchoResultMap = {}
    chartDetail.results.forEach((r) => {
      if (r.value !== null) map[r.keyword_id] = r.value
    })
    setResultMap(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsKey, setResultMap])

  const bwKg = parseFloat(resultMap['BW_kg'] ?? '0')

  const mmodeRefs: Record<string, [number, number] | null> = {}
  if (bwKg > 0) {
    ;['VSd', 'LVd', 'LVWd', 'VSs', 'LVs', 'LVWs', 'LA', 'AO'].forEach((id) => {
      mmodeRefs[id] = getMmodeRef(bwKg, id)
    })
  }

  const computedResults: Record<string, { result: string; comment: string }> = {}
  chartDetail.results.forEach((r) => {
    computedResults[r.keyword_id] = {
      result: r.result ?? '',
      comment: r.comment ?? '',
    }
  })

  const handleItemChange = useCallback(
    (keywordId: string, value: string) => {
      updateResult(keywordId, value)
      setPendingSave((prev) => new Set(prev).add(keywordId))
    },
    [updateResult],
  )

  const doSave = useCallback(async () => {
    const pending = pendingSaveRef.current
    if (pending.size === 0) return
    const allValues = { ...resultMapRef.current }
    const saves = Array.from(pending)
    setPendingSave(new Set())
    for (const keywordId of saves) {
      const value = allValues[keywordId] ?? ''
      await upsertEchoResult({ echoChartId: chartDetail.id, keywordId, value, allValues })
      await updateCalculatedResults({ echoChartId: chartDetail.id, changedKeywordId: keywordId, allValues })
    }
    // 저장 완료 후 서버 데이터(computedResults 등) 갱신
    startTransition(() => refresh())
  }, [chartDetail.id, refresh])

  function handleSave() {
    startSaving(doSave)
  }

  // 5초 입력 없으면 자동저장
  useEffect(() => {
    if (pendingSave.size === 0) return
    const timer = setTimeout(() => startSaving(doSave), 5000)
    return () => clearTimeout(timer)
  }, [pendingSave, doSave])

  // 컴포넌트 언마운트(페이지 이탈) 시 자동저장
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current.size > 0) doSave()
    }
  }, [doSave])

  // 탭 닫기/새로고침 시 저장 시도
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current.size > 0) doSave()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [doSave])

  function getSectionItems(section: EchoSection) {
    const activeIds = settings.active_items[section]
    const sectionMeta = testUIMeta.filter((m) => m.section === section)
    const filtered = activeIds ? sectionMeta.filter((m) => activeIds.includes(m.keywordID)) : sectionMeta
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

  return (
    <div className="mt-12 flex flex-col">
      {/* 담당의/검사자, 메모 */}
      <EchoInfoContainer chartDetail={chartDetail} />

      {/* 탭 + 저장 버튼 */}
      <div className="flex items-center justify-between border-b bg-white px-4">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'px-3 py-2 text-xs transition-colors',
                activeTab === t.key
                  ? 'border-b-2 border-black font-bold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {t.key === 'input' && pendingSave.size > 0 && (
                <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
              )}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || pendingSave.size === 0}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {activeTab === 'input' && (
          <div className="flex flex-1 gap-4 overflow-hidden">
            {guideImages.length > 0 && (
              <div className="w-64 shrink-0 overflow-y-auto border-r p-3">
                <EchoGuidePanel
                  images={guideImages}
                  highlightedKeywords={Object.keys(resultMap)}
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
              <div className="flex flex-col gap-3">
                {settings.section_order.map((section) => {
                  const items = getSectionItems(section)
                  if (items.length === 0) return null
                  return (
                    <EchoSectionWrapper
                      key={section}
                      sectionLabel={ECHO_SECTION_META[section]?.label ?? section}
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
          <div className="flex-1 overflow-auto p-4 pb-32">
            <EchoCompareTable current={chartDetail} history={history} testUIMeta={testUIMeta} />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="flex-1 overflow-auto p-4 pb-32">
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

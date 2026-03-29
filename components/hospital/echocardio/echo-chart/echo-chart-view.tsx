'use client'

import { useState, useEffect, useTransition, useCallback, useRef, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  EchoChartDetail,
  EchoChartWithPatient,
  EchoTemplateGuideImage,
  EchoResultMap,
  EchoSection,
} from '@/types/echocardio/echocardio-type'
import { useEchoContext } from '@/providers/echo-context-provider'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { upsertEchoResult, updateCalculatedResults } from '@/lib/services/echocardio/update-echo'
import { getMmodeRef } from '@/constants/hospital/echocardio/mmode-ref-dog'
import EchoSectionWrapper from '../echo-sections/echo-section-wrapper'
import EchoInputField from '../echo-sections/echo-input-field'
import EchoCompareTable from '../echo-compare/echo-compare-table'
import EchoReport from '../echo-report/echo-report'
import EchoInfoContainer from '../echo-info/echo-info-container'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import Image from 'next/image'
import { LayoutGridIcon, ListIcon, ImageIcon } from 'lucide-react'

interface EchoChartBodyProps {
  chartDetail: EchoChartDetail
  history: EchoChartWithPatient[]
  guideImages: EchoTemplateGuideImage[]
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
  const { template: settings, testUIMeta } = echoContextData as any
  const { refresh } = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('input')
  const [inputMode, setInputMode] = useState<'section' | 'flat' | 'guide'>('section')
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
    const sectionMeta = (testUIMeta as any[]).filter((m) => m.section === section)
    const filtered = activeIds ? sectionMeta.filter((m: any) => activeIds.includes(m.keywordID)) : sectionMeta
    const order = settings.item_order[section]
    if (!order || order.length === 0) return filtered
    return [...filtered].sort((a: any, b: any) => {
      const ai = order.indexOf(a.keywordID)
      const bi = order.indexOf(b.keywordID)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  // 모든 활성 항목을 flat하게 반환
  // _flat 순서가 지정된 경우 해당 순서 우선, 없으면 섹션 순서대로
  function getAllActiveItems() {
    const allItems = (settings.section_order as EchoSection[]).flatMap((section) =>
      getSectionItems(section),
    )
    const flatOrder: string[] = settings.item_order['_flat'] ?? []
    if (flatOrder.length === 0) return allItems
    return [...allItems].sort((a: any, b: any) => {
      const ai = flatOrder.indexOf(a.keywordID)
      const bi = flatOrder.indexOf(b.keywordID)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  const INPUT_MODES = [
    { key: 'section' as const, label: '섹션', icon: <LayoutGridIcon className="h-3 w-3" /> },
    { key: 'flat' as const, label: '목록', icon: <ListIcon className="h-3 w-3" /> },
    { key: 'guide' as const, label: '가이드', icon: <ImageIcon className="h-3 w-3" /> },
  ]

  const sharedInputProps = { resultMap, computedResults, mmodeRefs, onItemChange: handleItemChange }

  return (
    <div className="mt-12 flex flex-col">
      {/* 담당의/검사자, 메모 */}
      <EchoInfoContainer chartDetail={chartDetail} />

      {/* 탭 + 입력모드 + 저장 버튼 */}
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

        <div className="flex items-center gap-2">
          {/* 입력 모드 전환 (검사 입력 탭일 때만) */}
          {activeTab === 'input' && (
            <div className="flex rounded border">
              {INPUT_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setInputMode(m.key)}
                  title={m.label}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[10px] transition-colors first:rounded-l last:rounded-r',
                    inputMode === m.key
                      ? 'bg-black text-white'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {m.icon}
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>
          )}

          <Button size="sm" onClick={handleSave} disabled={isSaving || pendingSave.size === 0}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {activeTab === 'input' && (
          <>
            {/* ── 모드 1: 섹션별 ── */}
            {inputMode === 'section' && (
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="flex flex-col gap-3">
                  {(settings.section_order as EchoSection[]).map((section) => {
                    const items = getSectionItems(section)
                    if (items.length === 0) return null
                    return (
                      <EchoSectionWrapper
                        key={section}
                        sectionLabel={ECHO_SECTION_META[section]?.label ?? section}
                        items={items}
                        {...sharedInputProps}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── 모드 2: 목록형 (카테고리 구분 없이 나열) ── */}
            {inputMode === 'flat' && (
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="flex flex-col gap-2">
                  {getAllActiveItems().map((item: any) => (
                    <EchoInputField
                      key={item.keywordID}
                      item={item}
                      value={resultMap[item.keywordID] ?? ''}
                      computed={computedResults[item.keywordID]}
                      mmodeRef={mmodeRefs[item.keywordID] ?? undefined}
                      onChange={handleItemChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 모드 3: 가이드 이미지 + 연결 항목 ── */}
            {inputMode === 'guide' && (
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                {guideImages.length === 0 ? (
                  <p className="mt-8 text-center text-xs text-muted-foreground">
                    설정에서 가이드 이미지를 추가하세요
                  </p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {(() => {
                      const allActiveItems = getAllActiveItems()
                      const mappedKeywordIds = new Set(guideImages.flatMap((g) => g.mapped_keywords))
                      const unmappedItems = allActiveItems.filter((item: any) => !mappedKeywordIds.has(item.keywordID))

                      return (
                        <>
                          {guideImages.map((guide) => {
                            const guideItems = allActiveItems.filter((item: any) =>
                              guide.mapped_keywords.includes(item.keywordID),
                            )
                            return (
                              <div key={guide.id} className="rounded-md border bg-white">
                                <div className="border-b px-3 py-1.5">
                                  <span className="text-xs font-bold">{guide.view_name}</span>
                                </div>
                                <div className="flex gap-4 p-3">
                                  {/* 이미지 */}
                                  <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded border bg-muted">
                                    <Image
                                      src={guide.image_url}
                                      alt={guide.view_name}
                                      fill
                                      className="object-contain"
                                      sizes="160px"
                                    />
                                  </div>
                                  {/* 연결 항목 입력 */}
                                  <div className="flex flex-1 flex-col gap-2">
                                    {guideItems.length === 0 ? (
                                      <p className="text-[10px] text-muted-foreground">연결된 항목 없음</p>
                                    ) : (
                                      guideItems.map((item: any) => (
                                        <EchoInputField
                                          key={item.keywordID}
                                          item={item}
                                          value={resultMap[item.keywordID] ?? ''}
                                          computed={computedResults[item.keywordID]}
                                          mmodeRef={mmodeRefs[item.keywordID] ?? undefined}
                                          onChange={handleItemChange}
                                        />
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {/* 가이드에 연결되지 않은 나머지 항목 */}
                          {unmappedItems.length > 0 && (
                            <div className="rounded-md border bg-white">
                              <div className="border-b px-3 py-1.5">
                                <span className="text-xs font-bold text-muted-foreground">기타 항목</span>
                              </div>
                              <div className="flex flex-col gap-2 p-3">
                                {unmappedItems.map((item: any) => (
                                  <EchoInputField
                                    key={item.keywordID}
                                    item={item}
                                    value={resultMap[item.keywordID] ?? ''}
                                    computed={computedResults[item.keywordID]}
                                    mmodeRef={mmodeRefs[item.keywordID] ?? undefined}
                                    onChange={handleItemChange}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </>
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

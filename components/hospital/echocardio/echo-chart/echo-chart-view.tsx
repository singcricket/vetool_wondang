'use client'

import { useState, useEffect, useTransition, useCallback, useRef, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  EchoChartDetail,
  EchoChartWithPatient,
  EchoTemplate,
  EchoTemplateGuideImage,
  EchoResultMap,
  EchoSection,
} from '@/types/echocardio/echocardio-type'
import { useEchoContext } from '@/providers/echo-context-provider'
import { DEFAULT_SECTION_ORDER } from '@/constants/hospital/echocardio/echo-sections'
import { upsertEchoResult, updateCalculatedResults } from '@/lib/services/echocardio/update-echo'
import { LAYOUT_CANINE, LAYOUT_FELINE } from '@/constants/hospital/echocardio/echo-layouts'
import { getDogMmodeRef, getCatMmodeRef } from '@/constants/hospital/echocardio/echo-mmode-ref'
import type { Species } from '@/types/echocardio/echocardio-type'
import EchoCompareTable from '../echo-compare/echo-compare-table'
import EchoReport from '../echo-report/echo-report'
import EchoInfoContainer from '../echo-info/echo-info-container'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import Image from 'next/image'
import { LayoutGridIcon, ListIcon, ImageIcon } from 'lucide-react'
import EchoInputSectionMode from './echo-chart-input-mode/echo-input-section-mode'
import EchoInputFlatMode from './echo-chart-input-mode/echo-input-flat-mode'
import EchoInputGuideMode from './echo-chart-input-mode/echo-input-guide-mode'

interface EchoChartBodyProps {
  chartDetail: EchoChartDetail
  history: EchoChartWithPatient[]
  guideImages: EchoTemplateGuideImage[]
  hosId: string
}

type Tab = 'input' | 'report' | 'compare'

const TABS: { key: Tab; label: string }[] = [
  { key: 'input', label: '검사 입력' },
  { key: 'report', label: '리포트' },
  { key: 'compare', label: '비교' },
]

export default function EchoChartBody({
  chartDetail,
  history,
  guideImages,
  hosId,
}: EchoChartBodyProps) {
  const { echoContextData, resultMap, setResultMap, updateResult } = useEchoContext()
  const { templatesSpecies, testUIMeta } = echoContextData as any
  const { refresh } = useRouter()

  const species: Species =
    chartDetail.patient.species?.toLowerCase() === 'cat' ||
    chartDetail.patient.species?.toLowerCase() === 'feline'
      ? 'feline'
      : 'canine'

  // 차트에 저장된 템플릿 정보(template_id)가 있는지 확인
  const savedTemplateId = chartDetail.template_id

  const savedTemplate = savedTemplateId
    ? (echoContextData as any).templates?.find((t: EchoTemplate) => t.id === savedTemplateId)
    : null

  const settings = savedTemplate || templatesSpecies?.[species] || (echoContextData as any).template

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

  const bwVal = resultMap['BW_kg']
  const bwKg = !bwVal || bwVal === '' ? 0 : parseFloat(bwVal)

  const mmodeRefs: Record<string, [number, number] | null> = {}
  if (bwKg > 0) {
    ;['VSd', 'LVd', 'LVWd', 'VSs', 'LVs', 'LVWs', 'LA', 'AO'].forEach((id) => {
      mmodeRefs[id] =
        species === 'feline'
          ? getCatMmodeRef(id as any, bwKg)
          : getDogMmodeRef(id as any, bwKg)
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

    const currentValues: EchoResultMap & { species: Species } = {
      ...resultMapRef.current,
      species,
    }
    const bwVal = currentValues['BW_kg']
    const bw = !bwVal || bwVal === '' ? 0 : parseFloat(bwVal)

    // 체중 필수 입력 검증 (NaN 또는 0 이하 방지)
    if (isNaN(bw) || bw <= 0) {
      console.warn('체중(BW_kg)입력이 필요하여 저장을 중단합니다.')
      return
    }

    const saves = Array.from(pending)
    setPendingSave(new Set())
    for (const keywordId of saves) {
      const value = currentValues[keywordId] ?? ''
      await upsertEchoResult({ echoChartId: chartDetail.id, keywordId, value, allValues: currentValues })
      await updateCalculatedResults({ echoChartId: chartDetail.id, changedKeywordId: keywordId, allValues: currentValues })
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

  const speciesLayout = species === 'feline' ? LAYOUT_FELINE : LAYOUT_CANINE

  // 구형 섹션 명칭 -> 신형 섹션 명칭 매핑 (DB 싱크용)
  const SECTION_MAPPING: Record<string, string> = {
    Mmode: 'Objective_Evaluation',
    'Objective Evaluation': 'Objective_Evaluation',
    'Pulmonary Hypertension': 'Pulmonary_Hypertension',
    'MINE SCORE': 'MINE_SCORE',
    'HCM Evaluation': 'HCM_Evaluation',
  }

  function getSectionItems(section: EchoSection) {
    const targetSection = SECTION_MAPPING[section] || section
    const activeIds = settings.active_items?.[targetSection]

    // 1. 해당 섹션에 속하고, 종(species)이 맞으며, 최소 하나 이상의 섹션 정보가 있는 항목들 추출 (Requirement 3)
    const sectionMeta = (testUIMeta as any[]).filter(
      (m) =>
        (m.sections || []).includes(targetSection) &&
        (m.sections || []).length > 0 &&
        m.species.includes(species),
    )

    // 2. 템플릿 설정(active_items)이 있으면 해당 항목만 필터링, 없으면 해당 섹션 전체 노출 (Requirement 1)
    // 결과값(resultMap) 유무와 관계없이 항목 리스트(sectionMeta)를 기준으로 함 (Requirement 2)
    const filteredByActive =
      activeIds && Array.isArray(activeIds)
        ? sectionMeta.filter((m) => activeIds.includes(m.keywordID))
        : sectionMeta

    // 3. 순서 정렬
    const order = settings.item_order?.[targetSection]
    if (!order || order.length === 0) return filteredByActive

    return [...filteredByActive].sort((a, b) => {
      const ai = order.indexOf(a.keywordID)
      const bi = order.indexOf(b.keywordID)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  // 모든 활성 항목을 flat하게 반환 (목록형 및 가이드 모드용)
  function getAllActiveItems() {
    const sectionOrderFromSettings = (settings.section_order as EchoSection[]) || []
    const combinedSectionOrder = Array.from(
      new Set([...sectionOrderFromSettings, ...DEFAULT_SECTION_ORDER]),
    )

    const sectionOrder = combinedSectionOrder
      .map((s) => SECTION_MAPPING[s] || s)
      .filter((targetSection, index, self) => {
        const isValid = speciesLayout.sections.some((ls) => ls.sectionID === targetSection)
        return isValid && self.indexOf(targetSection) === index
      })

    const allItems = sectionOrder.flatMap((section) => getSectionItems(section as EchoSection))

    // 중복 제거 (여러 섹션에 걸쳐 있는 항목 대응)
    const uniqueItems = Array.from(
      new Map(allItems.map((item: any) => [item.keywordID, item])).values(),
    )

    const flatOrder: string[] = settings.item_order?.['_flat'] ?? []
    if (!flatOrder || flatOrder.length === 0) return uniqueItems

    return [...uniqueItems].sort((a: any, b: any) => {
      const ai = flatOrder.indexOf(a.keywordID)
      const bi = flatOrder.indexOf(b.keywordID)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }

  const INPUT_MODES = [
    { key: 'section' as const, label: '섹션', icon: <LayoutGridIcon className="h-3.5 w-3.5" /> },
    { key: 'flat' as const, label: '목록', icon: <ListIcon className="h-3.5 w-3.5" /> },
    { key: 'guide' as const, label: '가이드', icon: <ImageIcon className="h-3.5 w-3.5" /> },
  ]

  const sharedInputProps = { resultMap, computedResults, mmodeRefs, onItemChange: handleItemChange }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* 담당의/검사자, 메모 */}
      <EchoInfoContainer chartDetail={chartDetail} />

      {/* 상단 고정 네비게이션 영역 */}
      <div className="sticky top-12 z-20 bg-white shadow-sm">
        {/* 메인 탭 네비게이션 */}
        <div className="flex items-center justify-between border-b px-4">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'px-3 py-2 text-sm transition-colors',
                  activeTab === t.key
                    ? 'border-b-2 border-black font-bold text-black'
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
            {(isNaN(bwKg) || bwKg <= 0) && pendingSave.size > 0 && (
              <span className="text-xs font-bold text-destructive animate-pulse">
                체중을 먼저 입력해주세요 *
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || pendingSave.size === 0 || isNaN(bwKg) || bwKg <= 0}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>

        {/* 서브 네비게이션 (검사 입력 하위 모드) */}
        {activeTab === 'input' && (
          <div className="flex items-center gap-1 border-b bg-muted/30 px-4 py-1">
            {INPUT_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setInputMode(m.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all',
                  inputMode === m.key
                    ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                    : 'text-muted-foreground hover:bg-white/50 hover:text-foreground',
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {activeTab === 'input' && (
          <>
            {/* ── 모드 1: 섹션별 ── */}
            {inputMode === 'section' && (
              <EchoInputSectionMode
                species={species}
                settings={settings}
                getSectionItems={getSectionItems}
                SECTION_MAPPING={SECTION_MAPPING}
                sharedInputProps={{
                  ...sharedInputProps,
                  onItemChange: handleItemChange,
                }}
              />
            )}

            {/* ── 모드 2: 목록형 (카테고리 구분 없이 나열) ── */}
            {inputMode === 'flat' && (
              <EchoInputFlatMode
                allItems={getAllActiveItems()}
                resultMap={resultMap}
                computedResults={computedResults}
                mmodeRefs={mmodeRefs}
                onChange={handleItemChange}
              />
            )}

            {/* ── 모드 3: 가이드 이미지 + 연결 항목 ── */}
            {inputMode === 'guide' && (
              <EchoInputGuideMode
                guideImages={guideImages}
                allActiveItems={getAllActiveItems()}
                resultMap={resultMap}
                computedResults={computedResults}
                mmodeRefs={mmodeRefs}
                onChange={handleItemChange}
              />
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

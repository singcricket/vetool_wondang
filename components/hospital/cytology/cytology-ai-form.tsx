'use client'

import React, { useState } from 'react'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import type {
  CytologySampleType,
  CytologyRoutineTest,
  CytologyFindingOption,
} from '@/constants/hospital/cytology/cytology-types'
import { CheckCircle2, Microscope } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

// ── Types ─────────────────────────────────────────────────────

export interface CytologyImageData {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
}

export interface ExistingCytologyImage {
  id: string
  image_url: string
  tags: string | null
}

// ── Stain options ─────────────────────────────────────────────

const STAIN_OPTIONS = ['Diff-Quik', 'Wright-Giemsa', 'H&E', 'PAS', 'Gram', 'Ziehl-Neelsen']

// ── Helpers ───────────────────────────────────────────────────

function isAbnormalOption(options: CytologyFindingOption[] | undefined, value: string): boolean {
  return options?.find((o) => o.value === value)?.isAbnormal ?? false
}

async function urlToImageData(url: string): Promise<CytologyImageData | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const [header, base64] = dataUrl.split(',')
        const rawType = header.replace('data:', '').replace(';base64', '')
        const mediaType: CytologyImageData['mediaType'] =
          rawType === 'image/png' || rawType === 'image/webp' ? rawType : 'image/jpeg'
        resolve({ base64, mediaType })
      }
      reader.onerror = () => reject(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── Finding field (AI-prefilled, editable) ────────────────────

interface FieldProps {
  test: CytologyRoutineTest
  value: string | string[]
  onChange: (testId: string, value: string | string[]) => void
  hasAiValue: boolean
}

function AiField({ test, value, onChange, hasAiValue }: FieldProps) {
  const strVal = Array.isArray(value) ? value[0] ?? '' : value
  const arrVal = Array.isArray(value) ? value : value ? [value] : []

  const aiIndicator = hasAiValue ? (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
      AI 제안
    </span>
  ) : null

  function renderControl() {
    switch (test.testType) {
      case 'select':
        return (
          <select
            className={`w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              isAbnormalOption(test.options, strVal)
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : hasAiValue
                ? 'border-amber-300 bg-amber-50'
                : 'border-gray-300 bg-white'
            }`}
            value={strVal}
            onChange={(e) => onChange(test.testId, e.target.value)}
          >
            <option value="">-- 선택 --</option>
            {test.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )

      case 'semiquant': {
        const sqVals = ['none', 'rare', 'few', 'moderate', 'many'] as const
        const sqLabels: Record<string, string> = { none: '없음', rare: '소수', few: '적음', moderate: '중등도', many: '다수' }
        const base = 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
        const sel: Record<string, string> = {
          none: 'bg-gray-200 border-gray-400 text-gray-800 font-semibold',
          rare: 'bg-blue-500 border-blue-600 text-white font-semibold',
          few: 'bg-yellow-400 border-yellow-500 text-yellow-900 font-semibold',
          moderate: 'bg-orange-500 border-orange-600 text-white font-semibold',
          many: 'bg-red-600 border-red-700 text-white font-semibold',
        }
        return (
          <div className="flex flex-wrap gap-1">
            {sqVals.map((sq) => (
              <button key={sq} type="button" onClick={() => onChange(test.testId, sq)}
                className={`rounded border px-2.5 py-0.5 text-xs transition-all ${strVal === sq ? sel[sq] : base}`}>
                {sqLabels[sq]}
              </button>
            ))}
          </div>
        )
      }

      case 'boolean': {
        const opts = test.options ?? [
          { value: 'absent', label: '없음', isAbnormal: false },
          { value: 'present', label: '있음', isAbnormal: true },
        ]
        return (
          <div className="flex gap-2">
            {opts.map((opt) => {
              const active = strVal === opt.value
              return (
                <button key={opt.value} type="button" onClick={() => onChange(test.testId, opt.value)}
                  className={`rounded border px-3 py-1 text-sm transition-all ${
                    active
                      ? opt.isAbnormal
                        ? 'border-rose-500 bg-rose-500 text-white font-semibold'
                        : 'border-violet-500 bg-violet-500 text-white font-semibold'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        )
      }

      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-1.5">
            {test.options?.map((opt) => {
              const active = arrVal.includes(opt.value)
              return (
                <label key={opt.value}
                  className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-xs select-none ${
                    active ? 'border-violet-500 bg-violet-100 text-violet-900 font-medium' : 'border-gray-300 bg-white text-gray-700'
                  }`}>
                  <input type="checkbox" className="sr-only" checked={active}
                    onChange={() => onChange(test.testId, active ? arrVal.filter((v) => v !== opt.value) : [...arrVal, opt.value])} />
                  {opt.label}
                </label>
              )
            })}
          </div>
        )

      case 'text':
        return (
          <textarea
            className={`w-full rounded border px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              hasAiValue ? 'border-amber-300 bg-amber-50' : 'border-gray-300 bg-white'
            }`}
            rows={2} placeholder={test.placeholder ?? '소견 입력'}
            value={strVal} onChange={(e) => onChange(test.testId, e.target.value)} />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium text-gray-800">{test.label}</span>
        <span className="text-xs text-gray-400 italic">{test.labelEn}</span>
        {aiIndicator}
      </div>
      {renderControl()}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  aiSummary: string | null
  existingImages: ExistingCytologyImage[]
  hasClinicalInfo: boolean
  onAnalyze: (images: CytologyImageData[], stain: string) => Promise<void>
  isAnalyzing: boolean
  onChange: (testId: string, value: string | string[]) => void
}

export default function CytologyAiForm({
  sampleType,
  findings,
  aiSummary,
  existingImages,
  hasClinicalInfo,
  onAnalyze,
  isAnalyzing,
  onChange,
}: Props) {
  const [selectedStain, setSelectedStain] = useState('Diff-Quik')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(existingImages.map((img) => img.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  async function handleAnalyze() {
    if (selectedIds.size === 0 || isAnalyzing || isFetching) return
    setFetchError(null)
    setIsFetching(true)

    try {
      const selected = existingImages.filter((img) => selectedIds.has(img.id))
      const imageDataList: CytologyImageData[] = []

      for (const img of selected) {
        const data = await urlToImageData(img.image_url)
        if (data) imageDataList.push(data)
      }

      if (imageDataList.length === 0) {
        setFetchError('이미지를 불러오지 못했습니다. 다시 시도해주세요.')
        return
      }

      await onAnalyze(imageDataList, selectedStain)
    } finally {
      setIsFetching(false)
    }
  }

  const sampleDef = cytologyReference.routineMap[sampleType]
  const hasAnyFindings = Object.keys(findings).length > 0
  const selectedCount = selectedIds.size
  const busy = isAnalyzing || isFetching

  return (
    <div className="space-y-4">
      {/* 염색 방법 */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">염색 방법 선택</label>
        <div className="flex flex-wrap gap-2">
          {STAIN_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setSelectedStain(s)}
              className={`rounded border px-3 py-1 text-sm transition-all ${
                selectedStain === s
                  ? 'border-violet-600 bg-violet-600 text-white font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-violet-300'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 업로드된 이미지 선택 */}
      {existingImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10">
          <div className="p-3 bg-slate-100 rounded-full">
            <Microscope className="w-7 h-7 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-500">이 탭에 업로드된 사진이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">
              화면 우측 하단 카메라 버튼을 눌러 현미경 사진을 먼저 업로드해주세요
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">
              분석할 이미지 선택{' '}
              <span className="text-xs text-gray-400">({existingImages.length}장)</span>
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
                전체 선택
              </button>
              <span className="text-xs text-gray-300">|</span>
              <button type="button" onClick={deselectAll}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                선택 해제
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingImages.map((img) => {
              const selected = selectedIds.has(img.id)
              return (
                <div
                  key={img.id}
                  onClick={() => toggleSelect(img.id)}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-xl border-2 cursor-pointer transition-all',
                    selected
                      ? 'border-violet-500 ring-4 ring-violet-100'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="현미경 이미지" className="h-full w-full object-cover" />
                  {selected && (
                    <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white rounded-full p-0.5 shadow-md border border-white z-10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {!selected && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  )}
                </div>
              )
            })}
          </div>

          {/* 임상소견 누락 안내 */}
          {!hasClinicalInfo && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">임상소견을 먼저 입력하면 더 정확한 판독이 가능합니다.</span>
                {' '}전문가 모드 1단계(임상 소견)에 병변 위치·크기·임상 상황을 기입 후 판독을 의뢰해 주세요.
              </p>
            </div>
          )}

          {/* 에러 */}
          {fetchError && (
            <p className="rounded bg-rose-50 px-3 py-2 text-xs text-rose-700 border border-rose-200">{fetchError}</p>
          )}

          {/* 판독 버튼 */}
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={selectedCount === 0 || busy}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-all ${
              selectedCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : busy
                ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.99]'
            }`}
          >
            {isFetching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-white" />
                이미지 로딩 중...
              </span>
            ) : isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-white" />
                AI 판독 중... ({selectedCount}장)
              </span>
            ) : selectedCount === 0 ? (
              '이미지를 선택하세요'
            ) : (
              `AI 판독 시작 — ${selectedCount}장 분석`
            )}
          </button>
        </div>
      )}

      {/* AI 판독 결과 */}
      {aiSummary && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 space-y-1">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">AI 판독 결과</span>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
        </div>
      )}

      {/* 소견 검토 */}
      {(hasAnyFindings || aiSummary) && sampleDef && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-800">소견 검토 및 수정</h4>
            {aiSummary && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                AI 제안값 수정 가능
              </span>
            )}
          </div>
          {sampleDef.sections.map((section) => (
            <div key={section.sectionId} className="rounded-lg border bg-white p-3 space-y-3">
              <div className="flex items-baseline gap-1.5 border-b pb-1.5">
                <span className="text-xs font-semibold text-violet-700">{section.label}</span>
                <span className="text-xs text-gray-400 italic">{section.labelEn}</span>
              </div>
              {section.tests.map((test) => (
                <AiField key={test.testId} test={test}
                  value={findings[test.testId] ?? ''}
                  onChange={onChange}
                  hasAiValue={test.testId in findings && aiSummary !== null} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/*
        ── 아래는 이전 업로드 UI (주석 처리) ───────────────────────────────
        이미지 업로드는 화면 우측 하단 카메라 버튼(CytologyImageUploadDialog)으로 통합됨.

      const [images, setImages] = useState<UploadedImage[]>([])
      const [dragOver, setDragOver] = useState(false)
      const [error, setError] = useState<string | null>(null)
      const fileInputRef = useRef<HTMLInputElement>(null)
      const nextId = useRef(0)

      <div onClick={() => fileInputRef.current?.click()} onDragOver=... onDrop=...>
        드래그하거나 클릭하여 추가 / Ctrl+V 붙여넣기
      </div>
      ────────────────────────────────────────────────────────────────────── */}
    </div>
  )
}

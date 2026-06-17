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

// ── Clinical info fields used for AI context ──────────────────

const CLINICAL_INFO_FIELDS = [
  { key: 'ai_location',       label: '검체 채취 부위 / 병변 위치', placeholder: '예: 우측 외이도, 경추부 림프절, 복강 내 종괴', type: 'input' },
  { key: 'ai_size',           label: '크기 / 범위',                placeholder: '예: 약 2×3 cm, 전체적으로 발적',              type: 'input' },
  { key: 'ai_clinical_signs', label: '임상 증상 및 경과',          placeholder: '예: 3주 전부터 귀 소양감, 진행성 체중감소',    type: 'textarea' },
  { key: 'ai_notes',          label: '기타 참고사항',              placeholder: '예: 당뇨 기저질환, 스테로이드 투여 중',        type: 'textarea' },
] as const

type ClinicalInfoKey = typeof CLINICAL_INFO_FIELDS[number]['key']

// ── Main component ────────────────────────────────────────────

interface Props {
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  existingImages: ExistingCytologyImage[]
  onAnalyze: (images: CytologyImageData[], stain: string, clinicalContext: string) => Promise<void>
  isAnalyzing: boolean
  onChange: (testId: string, value: string | string[]) => void
}

export default function CytologyAiForm({
  sampleType,
  findings,
  existingImages,
  onAnalyze,
  isAnalyzing,
  onChange,
}: Props) {
  const [selectedStain, setSelectedStain] = useState('Diff-Quik')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [clinicalOpen, setClinicalOpen] = useState(true)

  // Clinical info — initialized from existing specialist findings if present
  const [clinicalValues, setClinicalValues] = useState<Record<ClinicalInfoKey, string>>({
    ai_location:       (findings['mass_location'] as string) ?? '',
    ai_size:           (findings['mass_size'] as string) ?? '',
    ai_clinical_signs: (findings['clinical_context'] as string) ?? '',
    ai_notes:          (findings['evaluator_comment'] as string) ?? '',
  })

  function updateClinical(key: ClinicalInfoKey, value: string) {
    setClinicalValues((prev) => ({ ...prev, [key]: value }))
    onChange(key, value)
  }

  function buildClinicalContext(): string {
    const parts: string[] = []
    if (clinicalValues.ai_location)       parts.push(`검체 부위/병변 위치: ${clinicalValues.ai_location}`)
    if (clinicalValues.ai_size)           parts.push(`크기/범위: ${clinicalValues.ai_size}`)
    if (clinicalValues.ai_clinical_signs) parts.push(`임상 증상 및 경과: ${clinicalValues.ai_clinical_signs}`)
    if (clinicalValues.ai_notes)          parts.push(`기타 참고사항: ${clinicalValues.ai_notes}`)
    return parts.join('\n')
  }

  const hasClinicalInfo = Object.values(clinicalValues).some((v) => v.trim().length > 0)

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

      await onAnalyze(imageDataList, selectedStain, buildClinicalContext())
    } finally {
      setIsFetching(false)
    }
  }

  const selectedCount = selectedIds.size
  const busy = isAnalyzing || isFetching

  return (
    <div className="space-y-4">

      {/* ── 임상 정보 입력 ───────────────────────────────────────── */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setClinicalOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-violet-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-semibold text-violet-900">임상 정보 입력</span>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              판독 정확도 향상
            </span>
            {hasClinicalInfo && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="임상 정보 입력됨" />
            )}
          </div>
          <svg
            className={`h-4 w-4 text-violet-400 transition-transform ${clinicalOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {clinicalOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-violet-100 pt-3">
            <p className="text-xs text-violet-700 leading-relaxed">
              임상 정보를 함께 전달하면 AI가 더 정확하게 판독합니다.
              <strong> 병변 위치, 크기, 증상 경과</strong>를 입력할수록 판독 품질이 높아집니다.
            </p>
            {CLINICAL_INFO_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{field.label}</label>
                {field.type === 'input' ? (
                  <input
                    type="text"
                    value={clinicalValues[field.key]}
                    onChange={(e) => updateClinical(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300"
                  />
                ) : (
                  <textarea
                    value={clinicalValues[field.key]}
                    onChange={(e) => updateClinical(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={2}
                    className="w-full rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
            ) : hasClinicalInfo ? (
              `AI 판독 시작 — ${selectedCount}장 분석 + 임상 정보 포함`
            ) : (
              `AI 판독 시작 — ${selectedCount}장 분석`
            )}
          </button>
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

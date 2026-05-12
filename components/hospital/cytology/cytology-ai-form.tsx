'use client'

import React, { useRef, useState } from 'react'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import type {
  CytologySampleType,
  CytologyRoutineTest,
  CytologyFindingOption,
} from '@/constants/hospital/cytology/cytology-types'

// ── Stain options ─────────────────────────────────────────────

const STAIN_OPTIONS = [
  'Diff-Quik',
  'Wright-Giemsa',
  'H&E',
  'PAS',
  'Gram',
  'Ziehl-Neelsen',
]

// ── Abnormal helper ───────────────────────────────────────────

function isAbnormalOption(
  options: CytologyFindingOption[] | undefined,
  value: string,
): boolean {
  return options?.find((o) => o.value === value)?.isAbnormal ?? false
}

// ── Editable finding field (AI-prefilled) ─────────────────────

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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'semiquant': {
        const sqVals = ['none', 'rare', 'few', 'moderate', 'many'] as const
        const sqLabels: Record<string, string> = {
          none: '없음',
          rare: '소수',
          few: '적음',
          moderate: '중등도',
          many: '다수',
        }
        const sqBase: Record<string, string> = {
          none: 'bg-gray-100 border-gray-300 text-gray-600',
          rare: 'bg-blue-100 border-blue-400 text-blue-800',
          few: 'bg-yellow-100 border-yellow-400 text-yellow-800',
          moderate: 'bg-orange-100 border-orange-400 text-orange-800',
          many: 'bg-red-100 border-red-400 text-red-800',
        }
        const sqSel: Record<string, string> = {
          none: 'bg-gray-300 border-gray-500 text-gray-900 font-semibold',
          rare: 'bg-blue-300 border-blue-600 text-blue-900 font-semibold',
          few: 'bg-yellow-300 border-yellow-600 text-yellow-900 font-semibold',
          moderate: 'bg-orange-300 border-orange-600 text-orange-900 font-semibold',
          many: 'bg-red-300 border-red-600 text-red-900 font-semibold',
        }
        return (
          <div className="flex flex-wrap gap-1">
            {sqVals.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => onChange(test.testId, sq)}
                className={`rounded border px-2.5 py-0.5 text-xs transition-all ${
                  strVal === sq ? sqSel[sq] : sqBase[sq]
                }`}
              >
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
              const sel = strVal === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(test.testId, opt.value)}
                  className={`rounded border px-3 py-1 text-sm transition-all ${
                    sel
                      ? opt.isAbnormal
                        ? 'border-rose-500 bg-rose-500 text-white font-semibold'
                        : 'border-violet-500 bg-violet-500 text-white font-semibold'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )
      }

      case 'multiselect': {
        return (
          <div className="flex flex-wrap gap-1.5">
            {test.options?.map((opt) => {
              const sel = arrVal.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-xs select-none ${
                    sel
                      ? 'border-violet-500 bg-violet-100 text-violet-900 font-medium'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={sel}
                    onChange={() => {
                      if (sel) {
                        onChange(test.testId, arrVal.filter((v) => v !== opt.value))
                      } else {
                        onChange(test.testId, [...arrVal, opt.value])
                      }
                    }}
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
        )
      }

      case 'text':
        return (
          <textarea
            className={`w-full rounded border px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              hasAiValue
                ? 'border-amber-300 bg-amber-50'
                : 'border-gray-300 bg-white'
            }`}
            rows={2}
            placeholder={test.placeholder ?? '소견 입력'}
            value={strVal}
            onChange={(e) => onChange(test.testId, e.target.value)}
          />
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
  imageUrls: string[]
  onAnalyze: (base64: string, mediaType: string, stain: string) => Promise<void>
  isAnalyzing: boolean
  onChange: (testId: string, value: string | string[]) => void
}

export default function CytologyAiForm({
  sampleType,
  findings,
  aiSummary,
  onAnalyze,
  isAnalyzing,
  onChange,
}: Props) {
  const [selectedStain, setSelectedStain] = useState('Diff-Quik')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

  function handleFile(file: File) {
    setSizeError(null)

    if (!file.type.startsWith('image/')) {
      setSizeError('이미지 파일만 업로드할 수 있습니다 (JPEG, PNG, WebP).')
      return
    }
    if (file.size > MAX_BYTES) {
      setSizeError('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result = "data:image/jpeg;base64,..."
      const [header, base64] = result.split(',')
      const mediaType = header.replace('data:', '').replace(';base64', '')
      void onAnalyze(base64, mediaType, selectedStain)
    }
    reader.readAsDataURL(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // Collect all tests from sampleDef for editable findings section
  const sampleDef = cytologyReference.routineMap[sampleType]
  const allTests: CytologyRoutineTest[] = sampleDef
    ? sampleDef.sections.flatMap((s) => s.tests)
    : []

  const hasAnyFindings = Object.keys(findings).length > 0

  return (
    <div className="space-y-4">
      {/* Stain selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">염색 방법 선택</label>
        <div className="flex flex-wrap gap-2">
          {STAIN_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStain(s)}
              className={`rounded border px-3 py-1 text-sm transition-all ${
                selectedStain === s
                  ? 'border-violet-600 bg-violet-600 text-white font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-violet-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-all ${
          dragOver
            ? 'border-violet-400 bg-violet-50'
            : 'border-gray-300 bg-gray-50 hover:border-violet-300 hover:bg-violet-50'
        }`}
      >
        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <span className="text-sm font-medium text-violet-700">AI 분석 중...</span>
          </div>
        ) : previewUrl ? (
          /* Preview + re-upload hint */
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="업로드된 세포학 이미지"
              className="max-h-48 rounded-md object-contain shadow"
            />
            <span className="text-xs text-gray-500">
              다른 이미지를 업로드하려면 클릭하세요
            </span>
          </div>
        ) : (
          <>
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M16.5 12l-4.5-4.5m0 0L7.5 12m4.5-4.5V18"
              />
            </svg>
            <p className="text-sm text-gray-600">
              이미지를 드래그하거나{' '}
              <span className="font-medium text-violet-600">클릭하여 업로드</span>
            </p>
            <p className="text-xs text-gray-400">JPEG, PNG, WebP · 최대 5MB</p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Size / type error */}
      {sizeError && (
        <p className="rounded bg-rose-50 px-3 py-2 text-xs text-rose-700 border border-rose-200">
          {sizeError}
        </p>
      )}

      {/* AI summary */}
      {aiSummary && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              AI 분석 결과
            </span>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Editable findings */}
      {(hasAnyFindings || aiSummary) && allTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-800">
              소견 검토 및 수정
            </h4>
            {aiSummary && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                AI 제안값 수정 가능
              </span>
            )}
          </div>

          {sampleDef ? (
            sampleDef.sections.map((section) => (
              <div
                key={section.sectionId}
                className="rounded-lg border bg-white p-3 space-y-3"
              >
                <div className="flex items-baseline gap-1.5 border-b pb-1.5">
                  <span className="text-xs font-semibold text-violet-700">
                    {section.label}
                  </span>
                  <span className="text-xs text-gray-400 italic">
                    {section.labelEn}
                  </span>
                </div>
                {section.tests.map((test) => (
                  <AiField
                    key={test.testId}
                    test={test}
                    value={findings[test.testId] ?? ''}
                    onChange={onChange}
                    hasAiValue={test.testId in findings && aiSummary !== null}
                  />
                ))}
              </div>
            ))
          ) : (
            /* Fallback: flat list for specialist-mode samples without routine sections */
            <div className="rounded-lg border bg-white p-3 space-y-3">
              {allTests.map((test) => (
                <AiField
                  key={test.testId}
                  test={test}
                  value={findings[test.testId] ?? ''}
                  onChange={onChange}
                  hasAiValue={test.testId in findings && aiSummary !== null}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty-state prompt */}
      {!aiSummary && !isAnalyzing && (
        <p className="text-center text-xs text-gray-400 py-2">
          이미지를 업로드하면 AI가 세포학적 소견을 자동 분석합니다.
        </p>
      )}
    </div>
  )
}

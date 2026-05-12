'use client'

import React, { useState } from 'react'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import type {
  CytologySampleType,
  CytologyCellType,
  CytologyMorphTest,
  CytologyFindingOption,
  CytologyCellCategory,
} from '@/constants/hospital/cytology/cytology-types'

// ── Shared mini-renderers (inline for specialist) ─────────────

function optionLabel(
  options: CytologyFindingOption[] | undefined,
  value: string,
): string {
  return options?.find((o) => o.value === value)?.label ?? value
}

function isAbnormalOption(
  options: CytologyFindingOption[] | undefined,
  value: string,
): boolean {
  return options?.find((o) => o.value === value)?.isAbnormal ?? false
}

interface FieldProps {
  test: CytologyMorphTest
  value: string | string[]
  onChange: (testId: string, value: string | string[]) => void
}

function MorphField({ test, value, onChange }: FieldProps) {
  const strVal = Array.isArray(value) ? value[0] ?? '' : value
  const arrVal = Array.isArray(value) ? value : value ? [value] : []

  switch (test.testType) {
    case 'select':
      return (
        <select
          className={`w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${
            isAbnormalOption(test.options, strVal)
              ? 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-gray-300 bg-white'
          }`}
          value={strVal}
          onChange={(e) => onChange(test.testId, e.target.value)}
        >
          <option value="">-- 선택 --</option>
          {test.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )

    case 'boolean': {
      const opts = test.options ?? [
        { value: 'false', label: '없음', isAbnormal: false },
        { value: 'true', label: '있음', isAbnormal: true },
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

    case 'multiselect':
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
                      onChange(
                        test.testId,
                        arrVal.filter((v) => v !== opt.value),
                      )
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

    case 'text':
      return (
        <textarea
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
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

// ── Step navigation ───────────────────────────────────────────

const STEP_LABELS = [
  '검체 품질',
  '염증 평가',
  '세포 분류',
  '악성도 기준',
  '임상 소견',
]

function StepNav({
  current,
  total,
  onStep,
}: {
  current: number
  total: number
  onStep: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <button
            type="button"
            onClick={() => onStep(i)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              i === current
                ? 'border-violet-600 bg-violet-600 text-white'
                : i < current
                ? 'border-violet-200 bg-violet-50 text-violet-600'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                i === current
                  ? 'bg-white text-violet-700 font-bold'
                  : i < current
                  ? 'bg-violet-200 text-violet-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}
            </span>
            {STEP_LABELS[i]}
          </button>
          {i < total - 1 && (
            <div
              className={`h-px w-4 shrink-0 ${
                i < current ? 'bg-violet-300' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Step 1 – Sample quality ───────────────────────────────────

const QUALITY_TESTS = [
  {
    id: 'sq_cellularity',
    label: '세포충실성',
    opts: [
      { v: 'low', label: '낮음', abnormal: true },
      { v: 'moderate', label: '중등도', abnormal: false },
      { v: 'high', label: '높음', abnormal: false },
    ],
  },
  {
    id: 'sq_hemodilution',
    label: '혈액 희석',
    opts: [
      { v: 'none', label: '없음', abnormal: false },
      { v: 'mild', label: '경도', abnormal: false },
      { v: 'moderate', label: '중등도', abnormal: false },
      { v: 'severe', label: '심함', abnormal: true },
    ],
  },
  {
    id: 'sq_necrosis',
    label: '괴사',
    opts: [
      { v: 'none', label: '없음', abnormal: false },
      { v: 'present', label: '있음', abnormal: true },
    ],
  },
]

function Step1Quality({
  findings,
  onChange,
}: {
  findings: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        슬라이드의 기술적 품질을 평가합니다.
      </p>
      {QUALITY_TESTS.map((t) => {
        const cur = (findings[t.id] as string) ?? ''
        return (
          <div key={t.id} className="space-y-1.5">
            <span className="text-sm font-medium text-gray-800">{t.label}</span>
            <div className="flex flex-wrap gap-2">
              {t.opts.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onChange(t.id, o.v)}
                  className={`rounded border px-3 py-1.5 text-sm transition-all ${
                    cur === o.v
                      ? o.abnormal
                        ? 'border-rose-500 bg-rose-500 text-white font-semibold'
                        : 'border-violet-500 bg-violet-500 text-white font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Step 2 – Inflammation ─────────────────────────────────────

const INFL_TYPES = [
  { v: 'neutrophilic_pure', label: '호중구성 (비패혈성)' },
  { v: 'neutrophilic_septic', label: '호중구성 (패혈성)' },
  { v: 'macrophagic', label: '대식세포성' },
  { v: 'eosinophilic', label: '호산구성' },
  { v: 'lymphocytic', label: '림프구성' },
  { v: 'mixed', label: '혼합성' },
  { v: 'none', label: '없음' },
]

const INFL_TOGGLES = [
  { id: 'infl_degenerate_neutrophils', label: '변성 호중구 (Degenerate neutrophils)' },
  { id: 'infl_giant_cells', label: '다핵 거대세포 (Giant cells)' },
  { id: 'infl_plasma_cells', label: '형질세포 (Plasma cells)' },
]

function Step2Inflammation({
  findings,
  onChange,
}: {
  findings: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
}) {
  const inflVal = (findings['infl_type'] as string) ?? ''

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-800">염증 유형</span>
        <div className="flex flex-wrap gap-2">
          {INFL_TYPES.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => onChange('infl_type', t.v)}
              className={`rounded border px-3 py-1.5 text-sm transition-all ${
                inflVal === t.v
                  ? 'border-violet-600 bg-violet-600 text-white font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-violet-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-800">추가 소견</span>
        {INFL_TOGGLES.map((t) => {
          const cur = (findings[t.id] as string) ?? 'false'
          const isOn = cur === 'true'
          return (
            <div key={t.id} className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-700">{t.label}</span>
              <div className="flex gap-2">
                {['false', 'true'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange(t.id, v)}
                    className={`rounded border px-2.5 py-0.5 text-xs transition-all ${
                      (v === 'true' && isOn) || (v === 'false' && !isOn)
                        ? v === 'true'
                          ? 'border-rose-500 bg-rose-500 text-white font-medium'
                          : 'border-violet-500 bg-violet-500 text-white font-medium'
                        : 'border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    {v === 'true' ? '있음' : '없음'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 3 – Cell classification ─────────────────────────────

const CELL_CATEGORY_TABS: { id: CytologyCellCategory; label: string }[] = [
  { id: 'epithelial', label: '상피세포' },
  { id: 'mesenchymal', label: '간엽세포' },
  { id: 'round_cell', label: '원형세포' },
]

function Step3Cells({
  findings,
  onChange,
}: {
  findings: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
}) {
  const [activeCategory, setActiveCategory] =
    useState<CytologyCellCategory>('epithelial')

  const identifiedRaw = findings['identified_cells']
  const identifiedCells: string[] = Array.isArray(identifiedRaw)
    ? identifiedRaw
    : identifiedRaw
    ? [identifiedRaw]
    : []

  function toggleCell(cellId: string) {
    if (identifiedCells.includes(cellId)) {
      onChange(
        'identified_cells',
        identifiedCells.filter((c) => c !== cellId),
      )
    } else {
      onChange('identified_cells', [...identifiedCells, cellId])
    }
  }

  const filteredCells = cytologyReference.cellTypes.filter(
    (c) => c.category === activeCategory,
  )

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {CELL_CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategory(tab.id)}
            className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-all ${
              activeCategory === tab.id
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cell type list */}
      <div className="space-y-3">
        {filteredCells.map((cell: CytologyCellType) => {
          const isIdentified = identifiedCells.includes(cell.cellId)
          return (
            <div
              key={cell.cellId}
              className={`rounded-lg border transition-all ${
                isIdentified
                  ? 'border-violet-300 bg-violet-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Cell header with identify toggle */}
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-gray-800">
                    {cell.nameKo}
                  </span>
                  <span className="ml-1.5 text-xs text-gray-400 italic">
                    {cell.nameEn}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCell(cell.cellId)}
                  className={`rounded border px-2.5 py-0.5 text-xs font-medium transition-all ${
                    isIdentified
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-violet-300'
                  }`}
                >
                  {isIdentified ? '확인됨 ✓' : '확인'}
                </button>
              </div>

              {/* Morph tests when identified */}
              {isIdentified && (
                <div className="border-t border-violet-200 px-3 pb-3 pt-2 space-y-3">
                  {cell.morphTests.map((mt: CytologyMorphTest) => (
                    <div key={mt.testId} className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="text-xs font-medium text-gray-700">
                          {mt.label}
                        </span>
                        <span className="text-xs text-gray-400 italic">
                          {mt.labelEn}
                        </span>
                      </div>
                      <MorphField
                        test={mt}
                        value={findings[mt.testId] ?? ''}
                        onChange={onChange}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 4 – Malignancy criteria ──────────────────────────────

const MALIG_CRITERIA = [
  {
    id: 'malig_criteria_1',
    label: '세포 크기 다형성',
    labelEn: 'Anisocytosis',
  },
  {
    id: 'malig_criteria_2',
    label: '핵 크기 다형성',
    labelEn: 'Anisokaryosis',
  },
  {
    id: 'malig_criteria_3',
    label: '다형성 핵소체',
    labelEn: 'Prominent / variable nucleoli',
  },
  {
    id: 'malig_criteria_4',
    label: '유사분열상',
    labelEn: 'Mitotic figures',
  },
  {
    id: 'malig_criteria_5',
    label: '핵 이형성',
    labelEn: 'Nuclear molding / irregular chromatin',
  },
]

function Step4Malignancy({
  findings,
  onChange,
}: {
  findings: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
}) {
  const count = MALIG_CRITERIA.filter(
    (c) => (findings[c.id] as string) === 'true',
  ).length

  const badgeColor =
    count === 0
      ? 'bg-gray-100 text-gray-600'
      : count <= 2
      ? 'bg-yellow-100 text-yellow-800'
      : count <= 3
      ? 'bg-orange-100 text-orange-800'
      : 'bg-red-100 text-red-800'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          악성 세포학적 기준을 체크합니다.
        </p>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColor}`}>
          {count}/5 기준 충족
        </span>
      </div>

      {MALIG_CRITERIA.map((c) => {
        const isChecked = (findings[c.id] as string) === 'true'
        return (
          <label
            key={c.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all select-none ${
              isChecked
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded accent-rose-500"
              checked={isChecked}
              onChange={(e) => onChange(c.id, e.target.checked ? 'true' : 'false')}
            />
            <div>
              <span
                className={`text-sm font-medium ${
                  isChecked ? 'text-rose-800' : 'text-gray-800'
                }`}
              >
                {c.label}
              </span>
              <span className="ml-1.5 text-xs text-gray-400 italic">
                {c.labelEn}
              </span>
            </div>
          </label>
        )
      })}
    </div>
  )
}

// ── Step 5 – Clinical context ─────────────────────────────────

const STAIN_METHODS = ['Diff-Quik', 'H&E', 'PAS', 'Gram']

function Step5Clinical({
  findings,
  onChange,
}: {
  findings: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
}) {
  const fields: { id: string; label: string; placeholder: string }[] = [
    { id: 'mass_location', label: '병변 위치', placeholder: '예: 우측 앞다리 피하 종괴' },
    { id: 'mass_size', label: '종괴 크기', placeholder: '예: 2.5 × 1.8 cm' },
    { id: 'clinical_context', label: '임상 상황', placeholder: '임상 증상, 경과 등을 입력하세요' },
  ]

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.id} className="space-y-1">
          <label className="text-sm font-medium text-gray-800">{f.label}</label>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder={f.placeholder}
            value={(findings[f.id] as string) ?? ''}
            onChange={(e) => onChange(f.id, e.target.value)}
          />
        </div>
      ))}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">염색 방법</label>
        <select
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          value={(findings['stain_method'] as string) ?? ''}
          onChange={(e) => onChange('stain_method', e.target.value)}
        >
          <option value="">-- 선택 --</option>
          {STAIN_METHODS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">
          판독자 소견 (Evaluator comment)
        </label>
        <textarea
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
          rows={4}
          placeholder="세포학적 소견 및 임상적 고려사항을 입력하세요"
          value={(findings['evaluator_comment'] as string) ?? ''}
          onChange={(e) => onChange('evaluator_comment', e.target.value)}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  onChange: (testId: string, value: string | string[]) => void
}

export default function CytologySpecialistForm({
  findings,
  onChange,
}: Props) {
  const [step, setStep] = useState(0)
  const TOTAL = 5

  function renderStep() {
    switch (step) {
      case 0:
        return <Step1Quality findings={findings} onChange={onChange} />
      case 1:
        return <Step2Inflammation findings={findings} onChange={onChange} />
      case 2:
        return <Step3Cells findings={findings} onChange={onChange} />
      case 3:
        return <Step4Malignancy findings={findings} onChange={onChange} />
      case 4:
        return <Step5Clinical findings={findings} onChange={onChange} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Step navigation */}
      <StepNav current={step} total={TOTAL} onStep={setStep} />

      {/* Step content */}
      <div className="rounded-lg border bg-white p-4 min-h-[280px]">
        <div className="mb-3 border-b pb-2">
          <h3 className="text-sm font-semibold text-violet-700">
            {STEP_LABELS[step]}
          </h3>
        </div>
        {renderStep()}
      </div>

      {/* Prev / Next */}
      <div className="flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          이전
        </button>
        {step < TOTAL - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded border border-violet-600 bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded border border-green-600 bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            완료 ✓
          </button>
        )}
      </div>
    </div>
  )
}

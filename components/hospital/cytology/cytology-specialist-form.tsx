'use client'

import React, { useState, useCallback } from 'react'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type {
  CytologySampleType,
  CytologyCellType,
  CytologyMorphTest,
  CytologyFindingOption,
  CytologyCellCategory,
} from '@/constants/hospital/cytology/cytology-types'
import {
  computeFluidHints,
  computeWbcHints,
  computeRbcHints,
  computePltHints,
  computeReticulocyte,
  DC_FIELDS as DC_FIELDS_SHARED,
} from '@/constants/hospital/cytology/cytology-hints'

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
      const sqBase = 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
      const sqSel: Record<string, string> = {
        none: 'bg-gray-200 border-gray-400 text-gray-800 font-semibold',
        rare: 'bg-blue-500 border-blue-600 text-white font-semibold',
        few: 'bg-yellow-400 border-yellow-500 text-yellow-900 font-semibold',
        moderate: 'bg-orange-500 border-orange-600 text-white font-semibold',
        many: 'bg-red-600 border-red-700 text-white font-semibold',
      }
      return (
        <div className="flex flex-wrap gap-1">
          {sqVals.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => onChange(test.testId, sq)}
              className={`rounded border px-2.5 py-0.5 text-xs transition-all ${
                strVal === sq ? sqSel[sq] : sqBase
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

const STEP_LABELS_DEFAULT = ['임상 소견', '검체 품질', '염증 평가', '세포 분류', '악성도 기준']
const STEP_LABELS_EFFUSION = ['임상 소견', '체강액 분석', '검체 품질', '염증 평가', '세포 분류', '악성도 기준']

// ── Step Effusion – Fluid analysis ───────────────────────────

type NumberField = { id: string; label: string; unit: string; pair?: string }

const FLUID_BIOCHEM: { section: string; fields: NumberField[] }[] = [
  {
    section: '기본 수치',
    fields: [
      { id: 'fluid_protein', label: '총단백 (Total Protein)', unit: 'g/dL' },
      { id: 'fluid_tncc', label: '총유핵세포수 (TNCC)', unit: '/μL' },
      { id: 'fluid_specific_gravity', label: '비중 (Specific Gravity)', unit: '' },
      { id: 'fluid_pcv', label: '체강액 PCV', unit: '%' },
      { id: 'blood_pcv', label: '혈액 PCV (비교용)', unit: '%' },
    ],
  },
  {
    section: '생화학 (체강액 / 혈청)',
    fields: [
      { id: 'fluid_bun', label: 'BUN', unit: 'mg/dL', pair: 'serum_bun' },
      { id: 'fluid_tbil', label: '총빌리루빈 (TBIL)', unit: 'mg/dL', pair: 'serum_tbil' },
      { id: 'fluid_glucose', label: 'Glucose', unit: 'mg/dL', pair: 'serum_glucose' },
      { id: 'fluid_triglyceride', label: 'Triglyceride', unit: 'mg/dL', pair: 'serum_triglyceride' },
      { id: 'fluid_albumin', label: 'Albumin', unit: 'g/dL', pair: 'serum_albumin' },
      { id: 'fluid_creatinine', label: 'Creatinine', unit: 'mg/dL', pair: 'serum_creatinine' },
    ],
  },
]

import type { FluidHint } from '@/constants/hospital/cytology/cytology-hints'

const HINT_STYLE: Record<FluidHint['severity'], string> = {
  info:     'border-blue-200 bg-blue-50 text-blue-800',
  warning:  'border-amber-300 bg-amber-50 text-amber-800',
  critical: 'border-rose-300 bg-rose-50 text-rose-800',
}
const HINT_DOT: Record<FluidHint['severity'], string> = {
  info:     'bg-blue-400',
  warning:  'bg-amber-400',
  critical: 'bg-rose-500',
}

function StepEffusion({
  findings,
  onChange,
  onAddToImpression,
}: {
  findings: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
  onAddToImpression?: (text: string) => void
}) {
  const hints = computeFluidHints(findings)

  const COLOR_OPTIONS = [
    { value: 'colorless', label: '무색' },
    { value: 'pale_yellow', label: '담황색' },
    { value: 'yellow', label: '황색' },
    { value: 'red', label: '혈성 (적색)' },
    { value: 'pink', label: '혈성 (분홍)' },
    { value: 'milky', label: '유백색 (Chylous)' },
    { value: 'brown', label: '갈색/담즙성' },
    { value: 'green', label: '녹색' },
  ]
  const TURBIDITY_OPTIONS = [
    { value: 'clear', label: '맑음 (Clear)' },
    { value: 'slightly_turbid', label: '약간 혼탁' },
    { value: 'turbid', label: '혼탁 (Turbid)' },
    { value: 'opaque', label: '불투명 (Opaque)' },
  ]
  const ODOR_OPTIONS = [
    { value: 'none', label: '없음' },
    { value: 'abnormal', label: '이상 냄새' },
    { value: 'fecal', label: '분변 냄새 (소화관 파열 의심)' },
  ]

  const val = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''

  function buildImpressionText(): string {
    const lines: string[] = ['[체강액 분석 소견]']
    const color = COLOR_OPTIONS.find((o) => o.value === val('fluid_color'))?.label
    const turb = TURBIDITY_OPTIONS.find((o) => o.value === val('fluid_turbidity'))?.label
    if (color || turb) lines.push(`외관: ${[color, turb].filter(Boolean).join(', ')}`)
    const protein = val('fluid_protein'); const tncc = val('fluid_tncc')
    if (protein) lines.push(`총단백: ${protein} g/dL`)
    if (tncc) lines.push(`TNCC: ${tncc} /μL`)
    if (hints.length > 0) {
      lines.push('')
      lines.push('[해석 소견]')
      hints.forEach((h) => lines.push(`• ${h.label}: ${h.detail}`))
    }
    return lines.join('\n')
  }

  return (
    <div className="space-y-5">
      {/* 외관 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">외관 검사</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">색깔</label>
            <select
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={val('fluid_color')}
              onChange={(e) => onChange('fluid_color', e.target.value)}
            >
              <option value="">-- 선택 --</option>
              {COLOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">혼탁도</label>
            <select
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={val('fluid_turbidity')}
              onChange={(e) => onChange('fluid_turbidity', e.target.value)}
            >
              <option value="">-- 선택 --</option>
              {TURBIDITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">냄새</label>
            <select
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={val('fluid_odor')}
              onChange={(e) => onChange('fluid_odor', e.target.value)}
            >
              <option value="">-- 선택 --</option>
              {ODOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 생화학 수치 입력 */}
      {FLUID_BIOCHEM.map(({ section, fields }) => (
        <div key={section} className="space-y-2">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">{section}</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields.map((f) =>
              f.pair ? (
                <div key={f.id} className="space-y-1">
                  <label className="text-sm font-medium text-gray-800">{f.label}</label>
                  <div className="flex gap-1 items-center">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">체강액</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" step="any" min="0"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                          placeholder="0.0"
                          value={val(f.id)}
                          onChange={(e) => onChange(f.id, e.target.value)}
                        />
                        {f.unit && <span className="text-xs text-gray-400 shrink-0">{f.unit}</span>}
                      </div>
                    </div>
                    <span className="text-slate-300 font-bold text-base mt-4">/</span>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">혈청</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" step="any" min="0"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                          placeholder="0.0"
                          value={val(f.pair)}
                          onChange={(e) => onChange(f.pair!, e.target.value)}
                        />
                        {f.unit && <span className="text-xs text-gray-400 shrink-0">{f.unit}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={f.id} className="space-y-1">
                  <label className="text-sm font-medium text-gray-800">{f.label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" step="any" min="0"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      placeholder="0.0"
                      value={val(f.id)}
                      onChange={(e) => onChange(f.id, e.target.value)}
                    />
                    {f.unit && <span className="text-xs text-gray-400 shrink-0">{f.unit}</span>}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ))}

      {/* 해석 소견 */}
      {hints.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">해석 소견</h4>
            {onAddToImpression && (
              <button
                type="button"
                onClick={() => onAddToImpression(buildImpressionText())}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium border border-violet-300 rounded px-2 py-0.5 hover:bg-violet-50 transition-colors"
              >
                최종 임상 소견에 추가 ↓
              </button>
            )}
          </div>
          <div className="space-y-2">
            {hints.map((h, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2.5 ${HINT_STYLE[h.severity]}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${HINT_DOT[h.severity]}`} />
                  <span className="text-xs font-semibold">{h.label}</span>
                </div>
                <p className="text-xs leading-relaxed pl-3.5">{h.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">* 참고 소견으로, 최종 진단은 임상 소견과 함께 수의사가 판단해야 합니다.</p>
        </div>
      )}

      {hints.length === 0 && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-400 text-center">
          수치를 입력하면 자동 해석 소견이 표시됩니다
        </div>
      )}
    </div>
  )
}

function StepNav({
  current,
  labels,
  onStep,
}: {
  current: number
  labels: string[]
  onStep: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {labels.map((label, i) => (
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
            {label}
          </button>
          {i < labels.length - 1 && (
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

// ── Blood Smear Steps ─────────────────────────────────────────

const STEP_LABELS_BLOOD_SMEAR = ['임상 소견', '검체 품질', '백혈구 평가', '적혈구 평가', '혈소판 평가']

const DC_FIELDS = DC_FIELDS_SHARED

const BS_HINT_STYLE: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  critical: 'border-rose-300 bg-rose-50 text-rose-800',
}
const BS_HINT_DOT: Record<string, string> = { info: 'bg-blue-400', warning: 'bg-amber-400', critical: 'bg-rose-500' }

function BsHintList({ hints }: { hints: { label: string; detail: string; severity: string }[] }) {
  if (hints.length === 0) return null
  return (
    <div className="space-y-1.5">
      {hints.map((h, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2 ${BS_HINT_STYLE[h.severity]}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`h-2 w-2 rounded-full shrink-0 ${BS_HINT_DOT[h.severity]}`} />
            <span className="text-xs font-semibold">{h.label}</span>
          </div>
          <p className="text-xs leading-relaxed pl-3.5">{h.detail}</p>
        </div>
      ))}
      <p className="text-[10px] text-slate-400">* 참고 소견 — 최종 판단은 임상 소견과 함께 수의사가 결정해야 합니다</p>
    </div>
  )
}

function StepBloodSmearQuality({ findings, onChange }: { findings: Record<string, string | string[]>; onChange: (id: string, v: string | string[]) => void }) {
  const s = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
  const QUALITY = [{ v: 'good', l: '양호' }, { v: 'adequate', l: '적절' }, { v: 'thick', l: '두꺼움' }, { v: 'thin', l: '얇음' }, { v: 'lysed', l: '용혈/파괴' }]
  const STAINS = [{ v: 'diff_quik', l: 'Diff-Quik' }, { v: 'wright_giemsa', l: 'Wright-Giemsa' }, { v: 'nmb', l: 'New Methylene Blue (NMB)' }, { v: 'may_grunwald', l: 'May-Grünwald-Giemsa' }]
  const AREA = [{ v: 'monolayer', l: '단층 영역 (최적)' }, { v: 'feathered_edge', l: '깃털 끝 (Feathered edge)' }, { v: 'body', l: '도말 중간부' }]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {([['bs_quality', '도말 품질', QUALITY], ['bs_stain', '염색 방법', STAINS], ['bs_area', '평가 영역', AREA]] as [string, string, {v:string;l:string}[]][]).map(([id, label, opts]) => (
          <div key={id} className="space-y-1">
            <label className="text-sm font-medium text-gray-800">{label}</label>
            <select className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={s(id)} onChange={(e) => onChange(id, e.target.value)}>
              <option value="">-- 선택 --</option>
              {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">비고</label>
        <textarea className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
          rows={2} placeholder="검체 관련 특이사항 입력" value={s('bs_quality_note')} onChange={(e) => onChange('bs_quality_note', e.target.value)} />
      </div>
    </div>
  )
}

// ── DC Counter Dialog ─────────────────────────────────────────

const DC_COUNTER_CELLS = [
  { id: 'dc_seg_neut',   label: '분엽호중구',   labelEn: 'Seg. Neutrophil',  color: 'bg-violet-500 active:bg-violet-600', badge: 'bg-violet-100 text-violet-800' },
  { id: 'dc_band',       label: 'Band 호중구',  labelEn: 'Band Neutrophil',  color: 'bg-amber-500 active:bg-amber-600',   badge: 'bg-amber-100 text-amber-800' },
  { id: 'dc_meta',       label: '후골수구',     labelEn: 'Metamyelocyte',    color: 'bg-orange-500 active:bg-orange-600', badge: 'bg-orange-100 text-orange-800' },
  { id: 'dc_lymph',      label: '림프구',       labelEn: 'Lymphocyte',       color: 'bg-blue-500 active:bg-blue-600',     badge: 'bg-blue-100 text-blue-800' },
  { id: 'dc_mono',       label: '단핵구',       labelEn: 'Monocyte',         color: 'bg-teal-500 active:bg-teal-600',     badge: 'bg-teal-100 text-teal-800' },
  { id: 'dc_eos',        label: '호산구',       labelEn: 'Eosinophil',       color: 'bg-pink-500 active:bg-pink-600',     badge: 'bg-pink-100 text-pink-800' },
  { id: 'dc_baso',       label: '호염기구',     labelEn: 'Basophil',         color: 'bg-indigo-500 active:bg-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
  { id: 'dc_blast',      label: 'Blast 세포',   labelEn: 'Blast',            color: 'bg-rose-600 active:bg-rose-700',     badge: 'bg-rose-100 text-rose-800' },
  { id: 'dc_atyp_lymph', label: '비정형 림프구', labelEn: 'Atyp. Lymphocyte', color: 'bg-red-500 active:bg-red-600',      badge: 'bg-red-100 text-red-800' },
]

function DCCounterDialog({ onApply }: { onApply: (pcts: Record<string, string>) => void }) {
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(DC_COUNTER_CELLS.map((c) => [c.id, 0])),
  )
  const [history, setHistory] = useState<string[]>([])

  const total = Object.values(counts).reduce((s, v) => s + v, 0)

  const pct = (id: string) =>
    total > 0 ? ((counts[id] / total) * 100).toFixed(1) : '0.0'

  const tap = useCallback((id: string) => {
    setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
    setHistory((prev) => [...prev, id])
  }, [])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setCounts((c) => ({ ...c, [last]: Math.max(0, (c[last] ?? 0) - 1) }))
      return prev.slice(0, -1)
    })
  }, [])

  const reset = useCallback(() => {
    setCounts(Object.fromEntries(DC_COUNTER_CELLS.map((c) => [c.id, 0])))
    setHistory([])
  }, [])

  const handleApply = () => {
    const pcts: Record<string, string> = {}
    for (const c of DC_COUNTER_CELLS) {
      pcts[c.id] = total > 0 ? ((counts[c.id] / total) * 100).toFixed(1) : '0'
    }
    onApply(pcts)
    setOpen(false)
  }

  const totalColor =
    total === 100 ? 'text-emerald-600' :
    total > 100 ? 'text-rose-600' :
    total > 0 ? 'text-amber-600' : 'text-slate-400'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 active:bg-violet-200 transition-colors"
        >
          <span className="text-base leading-none">🧮</span>
          DC 카운터
        </button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden max-h-[100dvh] h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-sm rounded-none sm:rounded-xl">
        <DialogHeader className="px-4 py-3 border-b bg-slate-50 shrink-0">
          <DialogTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>감별 백혈구 계수 (DC Counter)</span>
            <span className={`text-lg font-black tabular-nums ${totalColor}`}>
              {total}<span className="text-xs font-normal text-slate-400 ml-0.5">개</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Cell buttons */}
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {DC_COUNTER_CELLS.map((cell) => (
              <button
                key={cell.id}
                type="button"
                onClick={() => tap(cell.id)}
                className={`flex flex-col items-center justify-center rounded-xl py-3 px-2 text-white font-semibold shadow-sm select-none transition-transform active:scale-95 ${cell.color}`}
                style={{ minHeight: 80 }}
              >
                <span className="text-[12px] font-semibold leading-tight text-center">{cell.label}</span>
                <span className="text-[9px] opacity-70 leading-tight text-center mb-1.5">{cell.labelEn}</span>
                <span className="text-2xl font-black tabular-nums leading-none">{counts[cell.id]}</span>
                {total > 0 && (
                  <span className={`mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cell.badge}`}>
                    {pct(cell.id)}%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Running DC bar */}
          {total > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">현재 비율</p>
              <div className="flex h-4 rounded-full overflow-hidden border border-slate-100">
                {DC_COUNTER_CELLS.filter((c) => counts[c.id] > 0).map((c) => (
                  <div
                    key={c.id}
                    style={{ width: `${(counts[c.id] / total) * 100}%` }}
                    className={c.color.split(' ')[0]}
                    title={`${c.label}: ${counts[c.id]}개 (${pct(c.id)}%)`}
                  />
                ))}
              </div>
              <div className="mt-2 space-y-0.5">
                {DC_COUNTER_CELLS.filter((c) => counts[c.id] > 0).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{c.label}</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{counts[c.id]}개 · {pct(c.id)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 border-t bg-white px-3 py-3 flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-40 active:bg-slate-100 transition-colors"
          >
            ↩ 실행 취소
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 active:bg-slate-100 transition-colors"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={total === 0}
            className="flex-[2] rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white disabled:opacity-40 active:bg-violet-700 transition-colors"
          >
            입력하기 ({total}개 기준)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepBloodSmearWBC({ findings, onChange }: { findings: Record<string, string | string[]>; onChange: (id: string, v: string | string[]) => void }) {
  const s = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
  const numVal = (id: string) => s(id)
  const total = DC_FIELDS.reduce((sum, f) => sum + (parseFloat(s(f.id)) || 0), 0)
  const totalColor = Math.abs(total - 100) < 0.5 ? 'text-emerald-600' : total > 0 ? 'text-amber-600' : 'text-slate-400'

  const SQ_LEVELS = ['none', 'rare', 'few', 'moderate', 'many']
  const SQ_LABELS: Record<string, string> = { none: '없음', rare: '소수', few: '적음', moderate: '중등도', many: '다수' }
  const SQ_SEL: Record<string, string> = { none: 'bg-gray-200 border-gray-400 text-gray-800', rare: 'bg-blue-500 border-blue-600 text-white', few: 'bg-yellow-400 border-yellow-500 text-yellow-900', moderate: 'bg-orange-500 border-orange-600 text-white', many: 'bg-red-600 border-red-700 text-white' }
  const SQ_BASE = 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'

  const hints = computeWbcHints(findings)

  return (
    <div className="space-y-5">
      {/* DC */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b pb-1">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">감별 백혈구 계수 (DC)</h4>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${totalColor}`}>합계: {total.toFixed(0)}%{Math.abs(total - 100) < 0.5 ? ' ✓' : total > 0 ? ' (100% 아님)' : ''}</span>
            <DCCounterDialog
              onApply={(pcts) => {
                Object.entries(pcts).forEach(([id, val]) => onChange(id, val))
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DC_FIELDS.map((f) => (
            <div key={f.id} className="space-y-0.5">
              <label className="text-xs font-medium text-gray-700">{f.label} <span className="text-gray-400 font-normal">({f.labelEn})</span></label>
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="100" step="1"
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="0" value={numVal(f.id)} onChange={(e) => onChange(f.id, e.target.value)} />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 독성변화 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">독성변화 (Toxic Changes)</h4>
        {([['wbc_dohle', 'Döhle bodies'], ['wbc_toxic_gran', '독성 과립 (Toxic granulation)'], ['wbc_vacuolation', '세포질 공포화 (Cytoplasmic vacuolation)']] as [string, string][]).map(([id, label]) => (
          <div key={id} className="space-y-1">
            <label className="text-sm font-medium text-gray-800">{label}</label>
            <div className="flex flex-wrap gap-1">
              {SQ_LEVELS.map((sq) => (
                <button key={sq} type="button" onClick={() => onChange(id, sq)}
                  className={`rounded border px-2.5 py-0.5 text-xs transition-all font-medium ${s(id) === sq ? SQ_SEL[sq] : SQ_BASE}`}>
                  {SQ_LABELS[sq]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {([['wbc_giant_bands', '거대 Band (Giant bands)'], ['wbc_hyperseg', '과분엽 (Hypersegmentation)']] as [string, string][]).map(([id, label]) => (
          <div key={id} className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-800 flex-1">{label}</label>
            <div className="flex gap-2">
              {[['absent', '없음'], ['present', '있음']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => onChange(id, v)}
                  className={`rounded border px-3 py-1 text-sm transition-all ${s(id) === v ? (v === 'present' ? 'border-rose-500 bg-rose-500 text-white font-semibold' : 'border-violet-500 bg-violet-500 text-white font-semibold') : 'border-gray-300 bg-white text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 비정형 세포 */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">비정형 세포 / 림프구 평가</h4>
        {([['wbc_lgl', 'LGL (대과립 림프구)'], ['wbc_reactive_lymph', '반응성 림프구 증가']] as [string, string][]).map(([id, label]) => (
          <div key={id} className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-800 flex-1">{label}</label>
            <div className="flex gap-2">
              {[['absent', '없음'], ['present', '있음']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => onChange(id, v)}
                  className={`rounded border px-3 py-1 text-sm transition-all ${s(id) === v ? (v === 'present' ? 'border-amber-500 bg-amber-500 text-white font-semibold' : 'border-violet-500 bg-violet-500 text-white font-semibold') : 'border-gray-300 bg-white text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 해석 소견 */}
      {hints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">해석 소견</h4>
          <BsHintList hints={hints} />
        </div>
      )}
    </div>
  )
}

function StepBloodSmearRBC({ findings, onChange }: { findings: Record<string, string | string[]>; onChange: (id: string, v: string | string[]) => void }) {
  const s = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
  const arr = (id: string): string[] => Array.isArray(findings[id]) ? findings[id] as string[] : findings[id] ? [findings[id] as string] : []

  const GRADE = ['none', 'mild', 'moderate', 'marked']
  const GRADE_L: Record<string, string> = { none: '없음', mild: '경도', moderate: '중등도', marked: '현저' }
  const GRADE_SEL: Record<string, string> = { none: 'bg-gray-200 border-gray-400 text-gray-800', mild: 'bg-yellow-200 border-yellow-400 text-yellow-900', moderate: 'bg-orange-400 border-orange-500 text-white', marked: 'bg-red-600 border-red-700 text-white' }
  const G_BASE = 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'

  const POIKI = [
    { v: 'schistocytes', l: 'Schistocyte (파편 적혈구)' },
    { v: 'spherocytes', l: 'Spherocyte (구형 적혈구)' },
    { v: 'echinocytes', l: 'Echinocyte (가시 적혈구)' },
    { v: 'acanthocytes', l: 'Acanthocyte' },
    { v: 'target_cells', l: 'Target cell (과녁 적혈구)' },
    { v: 'rouleaux', l: 'Rouleaux (연전 형성)' },
  ]

  const PARASITES = [
    { v: 'none', l: '없음' }, { v: 'mycoplasma', l: 'Mycoplasma spp.' },
    { v: 'babesia_large', l: 'Babesia (대형, B. canis 형)' },
    { v: 'babesia_small', l: 'Babesia (소형, B. gibsoni 형)' },
    { v: 'cytauxzoon', l: 'Cytauxzoon felis (고양이)' },
  ]

  const reticResult = computeReticulocyte(findings)
  const rbcHints = computeRbcHints(findings)

  return (
    <div className="space-y-5">
      {/* 크기/색소 변화 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">크기 및 색소 변화</h4>
        {([['rbc_anisocytosis', '다양크기증 (Anisocytosis)'], ['rbc_polychromasia', '다색성 (Polychromasia)'], ['rbc_hypochromia', '저색소증 (Hypochromia)']] as [string, string][]).map(([id, label]) => (
          <div key={id} className="space-y-1">
            <label className="text-sm font-medium text-gray-800">{label}</label>
            <div className="flex flex-wrap gap-1">
              {GRADE.map((g) => (
                <button key={g} type="button" onClick={() => onChange(id, g)}
                  className={`rounded border px-2.5 py-0.5 text-xs transition-all font-medium ${s(id) === g ? GRADE_SEL[g] : G_BASE}`}>
                  {GRADE_L[g]}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          {([['rbc_microcytosis', '소구성 (Microcytosis)'], ['rbc_macrocytosis', '대구성 (Macrocytosis)'], ['rbc_autoagglutination', '자가응집 (Autoagglutination)'], ['rbc_nucleated_rbc', '유핵 적혈구 (nRBC)']] as [string, string][]).map(([id, label]) => (
            <div key={id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1.5 bg-gray-50">
              <label className="text-xs font-medium text-gray-700">{label}</label>
              <div className="flex gap-1.5">
                {[['absent', '없음'], ['present', '있음']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => onChange(id, v)}
                    className={`rounded border px-2 py-0.5 text-xs transition-all ${s(id) === v ? (v === 'present' ? 'border-rose-500 bg-rose-100 text-rose-800 font-semibold' : 'border-violet-500 bg-violet-100 text-violet-800 font-semibold') : 'border-gray-300 bg-white text-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 적혈구 형태 이상 */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">적혈구 형태 이상 (Poikilocytosis)</h4>
        <div className="flex flex-wrap gap-1.5">
          {POIKI.map((p) => {
            const active = arr('rbc_poikilocytes').includes(p.v)
            return (
              <label key={p.v} className={`flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1 text-xs select-none transition-all ${active ? 'border-rose-400 bg-rose-50 text-rose-800 font-medium' : 'border-gray-300 bg-white text-gray-700'}`}>
                <input type="checkbox" className="sr-only" checked={active}
                  onChange={() => onChange('rbc_poikilocytes', active ? arr('rbc_poikilocytes').filter((v) => v !== p.v) : [...arr('rbc_poikilocytes'), p.v])} />
                {p.l}
              </label>
            )
          })}
        </div>
      </div>

      {/* 기생충 */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">RBC 내 기생충</h4>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {PARASITES.map((p) => (
            <button key={p.v} type="button" onClick={() => onChange('rbc_parasites', p.v)}
              className={`rounded border px-2.5 py-1 text-xs transition-all ${s('rbc_parasites') === p.v ? (p.v === 'none' ? 'border-violet-500 bg-violet-500 text-white font-semibold' : 'border-rose-500 bg-rose-500 text-white font-semibold') : 'border-gray-300 bg-white text-gray-700'}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Reticulocyte 계산기 */}
      <div className="rounded-xl border-2 border-violet-200 bg-violet-50/50 p-4 space-y-4">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">세망적혈구 계산기 (Reticulocyte)</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-gray-700">종</label>
            <div className="flex gap-1.5">
              {[['dog', '개'], ['cat', '고양이']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => onChange('retic_species', v)}
                  className={`flex-1 rounded border py-1.5 text-sm transition-all ${s('retic_species') === v ? 'border-violet-600 bg-violet-600 text-white font-semibold' : 'border-gray-300 bg-white text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">환자 PCV (%)</label>
            <input type="number" min="0" max="70" step="0.1" placeholder="예: 28"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={s('retic_pcv')} onChange={(e) => onChange('retic_pcv', e.target.value)} />
          </div>
          {s('retic_species') !== 'cat' ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Retic 수 / 1,000 RBC</label>
              <input type="number" min="0" max="1000" step="1" placeholder="예: 24"
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                value={s('retic_count')} onChange={(e) => onChange('retic_count', e.target.value)} />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">응집형 / 1,000 RBC</label>
                <input type="number" min="0" max="1000" step="1" placeholder="예: 6"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={s('retic_agg_count')} onChange={(e) => onChange('retic_agg_count', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">점상형 / 1,000 RBC</label>
                <input type="number" min="0" max="1000" step="1" placeholder="예: 40"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={s('retic_punct_count')} onChange={(e) => onChange('retic_punct_count', e.target.value)} />
              </div>
            </>
          )}
        </div>

        {reticResult && (
          <div className={`rounded-lg border px-4 py-3 space-y-1 ${reticResult.species === 'dog' && reticResult.regenSev ? BS_HINT_STYLE[reticResult.regenSev] : 'border-violet-200 bg-white'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${reticResult.species === 'dog' && reticResult.regenSev ? '' : 'text-violet-800'}`}>
                {reticResult.species === 'dog' ? reticResult.regenLabel : (parseFloat(reticResult.aggPct ?? '0') > 0.4 ? '재생성 빈혈' : '비재생성 빈혈')}
              </span>
            </div>
            {reticResult.species === 'dog' ? (
              <div className="text-xs space-y-0.5 opacity-90">
                <p>Retic %: {reticResult.reticPct}%</p>
                <p>교정 Retic %: {reticResult.corrected}% (정상 PCV {45}% 기준)</p>
                <p>성숙시간: {reticResult.matTime}일 (PCV {s('retic_pcv')}%)</p>
                <p className="font-semibold">RPI: {reticResult.rpi} (기준: &gt;2 재생성, &lt;1 비재생성)</p>
              </div>
            ) : (
              <div className="text-xs space-y-0.5 opacity-90">
                <p>응집형 Retic %: {reticResult.aggPct}% (기준: &gt;0.4% = 재생성)</p>
                <p>교정 응집형 %: {reticResult.correctedAgg}% (정상 PCV 37% 기준)</p>
                {reticResult.punctPct && <p>점상형 Retic %: {reticResult.punctPct}% (재생성 지표 아님)</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RBC 해석 소견 */}
      {rbcHints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">해석 소견</h4>
          <BsHintList hints={rbcHints} />
        </div>
      )}
    </div>
  )
}

function StepBloodSmearPlatelet({ findings, onChange }: { findings: Record<string, string | string[]>; onChange: (id: string, v: string | string[]) => void }) {
  const s = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
  const hints = computePltHints(findings)

  const ESTIMATE = [{ v: 'adequate', l: '정상 (Adequate)' }, { v: 'decreased', l: '감소 (Decreased)' }, { v: 'increased', l: '증가 (Increased)' }, { v: 'cannot_estimate', l: '평가 불가' }]
  const LARGE = [{ v: 'absent', l: '없음' }, { v: 'present', l: '있음' }, { v: 'many', l: '다수' }]

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide border-b pb-1">혈소판 평가</h4>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">추정 개수</label>
          <div className="flex flex-wrap gap-1.5">
            {ESTIMATE.map((o) => (
              <button key={o.v} type="button" onClick={() => onChange('plt_estimate', o.v)}
                className={`rounded border px-3 py-1.5 text-sm transition-all ${s('plt_estimate') === o.v ? (o.v === 'decreased' ? 'border-rose-500 bg-rose-500 text-white font-semibold' : o.v === 'increased' ? 'border-amber-500 bg-amber-500 text-white font-semibold' : 'border-violet-500 bg-violet-500 text-white font-semibold') : 'border-gray-300 bg-white text-gray-700'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">HPF당 혈소판 수 <span className="text-xs text-gray-400">(100× 유침)</span></label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="1" placeholder="예: 8"
              className="w-32 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              value={s('plt_per_hpf')} onChange={(e) => onChange('plt_per_hpf', e.target.value)} />
            <span className="text-xs text-gray-500">개/HPF → 추정 {s('plt_per_hpf') ? `${(parseFloat(s('plt_per_hpf')) * 15000).toLocaleString()}/μL` : '-'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">거대혈소판</label>
            <div className="flex gap-1.5">
              {LARGE.map((o) => (
                <button key={o.v} type="button" onClick={() => onChange('plt_large', o.v)}
                  className={`flex-1 rounded border px-2 py-1 text-xs transition-all ${s('plt_large') === o.v ? 'border-violet-500 bg-violet-500 text-white font-semibold' : 'border-gray-300 bg-white text-gray-700'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">혈소판 응집</label>
            <div className="flex gap-1.5">
              {[['absent', '없음'], ['present', '있음']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => onChange('plt_clumps', v)}
                  className={`flex-1 rounded border px-2 py-1 text-xs transition-all ${s('plt_clumps') === v ? (v === 'present' ? 'border-amber-500 bg-amber-500 text-white font-semibold' : 'border-violet-500 bg-violet-500 text-white font-semibold') : 'border-gray-300 bg-white text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">해석 소견</h4>
          <BsHintList hints={hints} />
        </div>
      )}
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

    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  onChange: (testId: string, value: string | string[]) => void
  onAddToImpression?: (text: string) => void
}

export default function CytologySpecialistForm({
  sampleType,
  findings,
  onChange,
  onAddToImpression,
}: Props) {
  const [step, setStep] = useState(0)
  const isEffusion = sampleType === 'effusion'
  const isBloodSmear = sampleType === 'blood_smear'
  const stepLabels = isEffusion ? STEP_LABELS_EFFUSION : isBloodSmear ? STEP_LABELS_BLOOD_SMEAR : STEP_LABELS_DEFAULT
  const TOTAL = stepLabels.length

  function renderStep() {
    if (isBloodSmear) {
      switch (step) {
        case 0: return <Step5Clinical findings={findings} onChange={onChange} />
        case 1: return <StepBloodSmearQuality findings={findings} onChange={onChange} />
        case 2: return <StepBloodSmearWBC findings={findings} onChange={onChange} />
        case 3: return <StepBloodSmearRBC findings={findings} onChange={onChange} />
        case 4: return <StepBloodSmearPlatelet findings={findings} onChange={onChange} />
        default: return null
      }
    }
    if (isEffusion) {
      switch (step) {
        case 0: return <Step5Clinical findings={findings} onChange={onChange} />
        case 1: return <StepEffusion findings={findings} onChange={onChange} onAddToImpression={onAddToImpression} />
        case 2: return <Step1Quality findings={findings} onChange={onChange} />
        case 3: return <Step2Inflammation findings={findings} onChange={onChange} />
        case 4: return <Step3Cells findings={findings} onChange={onChange} />
        case 5: return <Step4Malignancy findings={findings} onChange={onChange} />
        default: return null
      }
    }
    switch (step) {
      case 0: return <Step5Clinical findings={findings} onChange={onChange} />
      case 1: return <Step1Quality findings={findings} onChange={onChange} />
      case 2: return <Step2Inflammation findings={findings} onChange={onChange} />
      case 3: return <Step3Cells findings={findings} onChange={onChange} />
      case 4: return <Step4Malignancy findings={findings} onChange={onChange} />
      default: return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Step navigation */}
      <StepNav current={step} labels={stepLabels} onStep={setStep} />

      {/* Step content */}
      <div className="rounded-lg border bg-white p-4 min-h-[280px]">
        <div className="mb-3 border-b pb-2">
          <h3 className="text-sm font-semibold text-violet-700">
            {stepLabels[step]}
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

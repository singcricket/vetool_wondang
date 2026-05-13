'use client'

import React from 'react'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import type {
  CytologySampleType,
  CytologyRoutineTest,
  CytologyFindingOption,
} from '@/constants/hospital/cytology/cytology-types'

// ── Semiquant helpers ─────────────────────────────────────────

const SEMIQUANT_VALUES = ['none', 'rare', 'few', 'moderate', 'many'] as const

const semiquantBg = 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'

const semiquantSelectedBg: Record<string, string> = {
  none: 'bg-gray-200 border-gray-400 text-gray-800 font-semibold',
  rare: 'bg-blue-500 border-blue-600 text-white font-semibold',
  few: 'bg-yellow-400 border-yellow-500 text-yellow-900 font-semibold',
  moderate: 'bg-orange-500 border-orange-600 text-white font-semibold',
  many: 'bg-red-600 border-red-700 text-white font-semibold',
}

const semiquantLabels: Record<string, string> = {
  none: '없음',
  rare: '소수',
  few: '적음',
  moderate: '중등도',
  many: '다수',
}

// ── Abnormal highlight ────────────────────────────────────────

function isOptionAbnormal(
  options: CytologyFindingOption[] | undefined,
  value: string,
): boolean {
  if (!options) return false
  return options.find((o) => o.value === value)?.isAbnormal ?? false
}

// ── Individual test renderers ─────────────────────────────────

interface TestProps {
  test: CytologyRoutineTest
  value: string | string[]
  onChange: (testId: string, value: string | string[]) => void
}

function SelectTest({ test, value, onChange }: TestProps) {
  const strVal = Array.isArray(value) ? value[0] ?? '' : value
  const abnormal = isOptionAbnormal(test.options, strVal)

  return (
    <select
      className={`w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${
        abnormal
          ? 'border-amber-400 bg-amber-50 text-amber-900'
          : 'border-gray-300 bg-white text-gray-900'
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
}

function SemiquantTest({ test, value, onChange }: TestProps) {
  const strVal = Array.isArray(value) ? value[0] ?? '' : value

  return (
    <div className="flex flex-wrap gap-1.5">
      {SEMIQUANT_VALUES.map((sq) => {
        const isSelected = strVal === sq
        return (
          <button
            key={sq}
            type="button"
            onClick={() => onChange(test.testId, sq)}
            className={`rounded border px-3 py-1 text-xs transition-all ${
              isSelected ? semiquantSelectedBg[sq] : semiquantBg
            }`}
          >
            {semiquantLabels[sq]}
          </button>
        )
      })}
    </div>
  )
}

function BooleanTest({ test, value, onChange }: TestProps) {
  const strVal = Array.isArray(value) ? value[0] ?? '' : value
  const opts = test.options ?? [
    { value: 'absent', label: '없음', isAbnormal: false },
    { value: 'present', label: '있음', isAbnormal: true },
  ]

  return (
    <div className="flex gap-2">
      {opts.map((opt) => {
        const isSelected = strVal === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(test.testId, opt.value)}
            className={`rounded border px-4 py-1.5 text-sm transition-all ${
              isSelected
                ? opt.isAbnormal
                  ? 'border-rose-500 bg-rose-500 text-white font-semibold'
                  : 'border-violet-500 bg-violet-500 text-white font-semibold'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function TextTest({ test, value, onChange }: TestProps) {
  const strVal = Array.isArray(value) ? value.join('\n') : value

  return (
    <textarea
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
      rows={2}
      placeholder={test.placeholder ?? '소견을 입력하세요'}
      value={strVal}
      onChange={(e) => onChange(test.testId, e.target.value)}
    />
  )
}

function MultiSelectTest({ test, value, onChange }: TestProps) {
  const arrVal = Array.isArray(value) ? value : value ? [value] : []

  function toggle(optValue: string) {
    if (arrVal.includes(optValue)) {
      onChange(
        test.testId,
        arrVal.filter((v) => v !== optValue),
      )
    } else {
      onChange(test.testId, [...arrVal, optValue])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {test.options?.map((opt) => {
        const isSelected = arrVal.includes(opt.value)
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 text-xs select-none transition-all ${
              isSelected
                ? opt.isAbnormal
                  ? 'border-amber-500 bg-amber-100 text-amber-900 font-medium'
                  : 'border-violet-500 bg-violet-100 text-violet-900 font-medium'
                : 'border-gray-300 bg-white text-gray-700'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={isSelected}
              onChange={() => toggle(opt.value)}
            />
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}

// ── Single test item ──────────────────────────────────────────

function TestItem({ test, value, onChange }: TestProps) {
  function renderControl() {
    switch (test.testType) {
      case 'select':
        return <SelectTest test={test} value={value} onChange={onChange} />
      case 'semiquant':
        return <SemiquantTest test={test} value={value} onChange={onChange} />
      case 'boolean':
        return <BooleanTest test={test} value={value} onChange={onChange} />
      case 'text':
        return <TextTest test={test} value={value} onChange={onChange} />
      case 'multiselect':
        return <MultiSelectTest test={test} value={value} onChange={onChange} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="text-sm font-medium text-gray-800">{test.label}</span>
        <span className="text-xs text-gray-400 italic">{test.labelEn}</span>
      </div>
      {renderControl()}
      {test.note && (
        <p className="text-xs text-gray-400 leading-relaxed">{test.note}</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  onChange: (testId: string, value: string | string[]) => void
}

export default function CytologyRoutineForm({
  sampleType,
  findings,
  onChange,
}: Props) {
  const sampleDef = cytologyReference.routineMap[sampleType]

  if (!sampleDef) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        이 검체 유형은 루틴 양식을 지원하지 않습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sampleDef.sections.map((section) => (
        <div
          key={section.sectionId}
          className="rounded-lg border bg-white p-4 mb-3 shadow-sm"
        >
          <div className="mb-3 flex items-baseline gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold text-violet-700">
              {section.label}
            </h3>
            <span className="text-xs text-gray-400 italic">
              {section.labelEn}
            </span>
          </div>

          <div className="space-y-4">
            {section.tests.map((test) => {
              // dependsOn guard
              if (test.dependsOn) {
                const depVal = findings[test.dependsOn.testId]
                const depStrVal = Array.isArray(depVal) ? depVal[0] ?? '' : depVal ?? ''
                if (depStrVal !== test.dependsOn.value) return null
              }

              return (
                <TestItem
                  key={test.testId}
                  test={test}
                  value={findings[test.testId] ?? ''}
                  onChange={onChange}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

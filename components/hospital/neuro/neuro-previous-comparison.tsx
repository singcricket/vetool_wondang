'use client'

import React from 'react'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import type { NeuroDomainSection, NeuroTestItem, SelectNeuroTest, MultiSelectNeuroTest, BooleanNeuroTest } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import { Label } from '@/components/ui/label'

interface Props {
  domain: NeuroDomainSection
  prevResults: Record<string, string | string[]>
}

export default function NeuroPreviousComparison({ domain, prevResults }: Props) {
  const isGateOpen = neuroReference.isDomainVisible(domain, prevResults as Record<string, string>)
  const gateTest = domain.statusGate

  return (
    <div className="space-y-6 max-w-3xl h-full">
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-500">{domain.domainNameKo}</h2>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">이전 기록 (Previous)</span>
        </div>
        <div className="flex items-center gap-3 mt-4 bg-slate-50 p-3 rounded-md border border-dashed border-slate-200">
          <Label className="font-semibold text-base text-slate-500">
            {isGateOpen ? '이상 소견 있음 (Abnormal)' : '정상 (Normal)'}
          </Label>
        </div>
      </div>

      {isGateOpen && (
        <div className="space-y-6">
          {domain.tests.filter(test => neuroReference.isNeuroTestVisible(test, prevResults)).map(test => {
            const val = prevResults[test.testID]
            if (!val || (Array.isArray(val) && val.length === 0)) return null // Skip empty previous results

            return (
              <div key={test.testID} className="bg-slate-50/50 p-3 rounded border border-dashed border-slate-200">
                <Label className="text-sm font-semibold mb-1 block text-slate-500">
                  {test.testNameKo}
                  <span className="text-[12px] font-normal text-slate-400 ml-1.5 italic">({test.testName})</span>
                </Label>
                <div className="mt-1 text-sm font-medium text-slate-700">
                  {renderTestValue(test, val)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function renderTestValue(test: NeuroTestItem, currentValue: string | string[]) {
  switch (test.testType) {
    case 'select': {
      const opt = (test as SelectNeuroTest).options.find(o => o.value === currentValue)
      return <span className={opt?.isAbnormal ? 'text-rose-600' : 'text-slate-600'}>
        {opt ? `${opt.labelKo} (${opt.label})` : currentValue}
      </span>
    }
    case 'grade': {
      const opt = (test as any).grades.find((g: any) => String(g.grade) === currentValue)
      return <span className={opt?.isAbnormal ? 'text-rose-600' : 'text-slate-600'}>
        {opt ? `${opt.labelKo} (${opt.label})` : currentValue}
      </span>
    }
    case 'multiselect': {
      const arr = currentValue as string[]
      const opts = (test as MultiSelectNeuroTest).options.filter(o => arr.includes(o.value))
      return (
        <div className="flex flex-wrap gap-1">
          {opts.map(o => (
            <span key={o.value} className={`px-2 py-0.5 rounded-full text-[11px] ${o.isAbnormal ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
              {o.labelKo} ({o.label})
            </span>
          ))}
        </div>
      )
    }
    case 'boolean': {
      const t = test as BooleanNeuroTest
      const isTrue = currentValue === 'true'
      const label = isTrue ? `${t.positiveResultTextKo} (${t.positiveResultText})` : `${t.negativeResultTextKo} (${t.negativeResultText})`
      const isAbnormal = isTrue ? t.positiveIsAbnormal : !t.positiveIsAbnormal
      return <span className={isAbnormal ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>{label}</span>
    }
    case 'range':
      return <span>{currentValue} {test.unit}</span>
    default:
      return <span>{currentValue}</span>
  }
}

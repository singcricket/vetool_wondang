'use client'

import React, { useMemo } from 'react'
import type { OphDomainSection, OphTestItem } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/utils'
import { History } from 'lucide-react'

interface Props {
  domain: OphDomainSection
  prevResults: Record<string, string | string[]>
}

export default function OphthalmicPreviousComparison({ domain, prevResults }: Props) {
  const isGateOpen = prevResults[domain.statusGate.testID] === domain.statusGate.abnormalValue

  const groupedTests = useMemo(() => {
    const od: OphTestItem[] = []
    const os: OphTestItem[] = []
    const ou: OphTestItem[] = []
    const global: OphTestItem[] = []

    domain.tests.forEach(test => {
      const val = prevResults[test.testID]
      if (val === undefined) return

      if (test.eye === 'OD') od.push(test)
      else if (test.eye === 'OS') os.push(test)
      else if (test.eye === 'OU') ou.push(test)
      else global.push(test)
    })

    return { od, os, ou, global }
  }, [domain.tests, prevResults])

  if (!isGateOpen) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 border-2 border-dashed rounded-2xl bg-slate-50/30">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-bold">이전 검사에서 정상(Normal)</p>
        <p className="text-[11px] mt-1 italic">또는 이 영역의 데이터가 기록되지 않았습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
        <History className="w-4 h-4 text-slate-500" />
        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Previous Record</span>
      </div>

      <div className="space-y-6">
        {/* Global / OU */}
        {[...groupedTests.global, ...groupedTests.ou].map(test => (
          <PrevTestCard key={test.testID} test={test} value={prevResults[test.testID]} />
        ))}

        {/* OD Column */}
        {groupedTests.od.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-blue-600 px-1 uppercase tracking-widest">OD Result</h4>
            {groupedTests.od.map(test => (
              <PrevTestCard key={test.testID} test={test} value={prevResults[test.testID]} side="OD" />
            ))}
          </div>
        )}

        {/* OS Column */}
        {groupedTests.os.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-orange-600 px-1 uppercase tracking-widest">OS Result</h4>
            {groupedTests.os.map(test => (
              <PrevTestCard key={test.testID} test={test} value={prevResults[test.testID]} side="OS" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PrevTestCard({ test, value, side }: { test: OphTestItem, value: any, side?: 'OD' | 'OS' }) {
  const getFormattedValue = () => {
    if (value === undefined || value === null) return '-'
    
    switch (test.testType) {
      case 'select':
        const opt = test.options.find(o => o.value === value)
        return opt ? `${opt.labelKo} (${opt.label})` : value
      case 'multiselect':
        const vals = Array.isArray(value) ? value : [value]
        return vals.map(v => {
          const o = test.options.find(opt => opt.value === v)
          return o ? o.labelKo : v
        }).join(', ')
      case 'boolean':
        return value === 'true' ? test.positiveLabelKo : test.negativeLabelKo
      case 'range':
        return `${value} ${test.unit}`
      case 'text':
        return value
      default:
        return String(value)
    }
  }

  const isAbnormal = () => {
    if (test.testType === 'select') return test.options.find(o => o.value === value)?.isAbnormal
    if (test.testType === 'multiselect') return (Array.isArray(value) ? value : [value]).some(v => test.options.find(o => o.value === v)?.isAbnormal)
    if (test.testType === 'boolean') return value === 'true' && test.positiveIsAbnormal
    return false
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border bg-white/50",
      isAbnormal() ? "border-rose-200 bg-rose-50/30 shadow-inner" : "border-slate-100"
    )}>
      <Label className="text-[11px] font-bold text-slate-500 block mb-1">
        {test.testNameKo}
      </Label>
      <p className={cn(
        "text-sm font-black break-words",
        isAbnormal() ? "text-rose-700" : "text-slate-700"
      )}>
        {getFormattedValue()}
      </p>
    </div>
  )
}

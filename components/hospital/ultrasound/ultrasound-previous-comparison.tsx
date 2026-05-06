'use client'

import React from 'react'
import { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'
import { organSections, Organ } from '@/constants/hospital/ultrasound'
import { Badge } from '@/components/ui/badge'

interface Props {
  organ: Organ
  prevData?: UltrasoundChartOrgan
}

export default function UltrasoundPreviousComparison({ organ, prevData }: Props) {
  if (!prevData || prevData.status === 'not_examined') {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-2">
        <p className="text-xs italic">이전 검사 기록이 없습니다.</p>
      </div>
    )
  }

  if (prevData.status === 'absent') {
    return (
      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
        <p className="text-xs text-red-600 font-medium">장기 결손 / 적출됨</p>
        {prevData.organ_memo && (
          <p className="text-xs text-slate-500 mt-1 italic">"{prevData.organ_memo}"</p>
        )}
      </div>
    )
  }

  const section = organSections.find((s) => s.organ === organ)
  if (!section) return null

  const findings = prevData.findings_data as Record<string, any>

  return (
    <div className="space-y-4">
      {/* Organ Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
        <Badge variant={prevData.status === 'normal' ? 'outline' : 'destructive'} className="text-[10px] h-5 px-1.5">
          {prevData.status === 'normal' ? '정상' : '이상 소견'}
        </Badge>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {section.tests.map((test) => {
          const value = findings[test.testID]
          if (value === undefined || value === null || value === '') return null

          let displayValue = ''
          let isAbnormal = false

          if (test.testType === 'select') {
            const opt = test.options?.find((o) => o.value === value)
            displayValue = opt?.labelKo || value
            isAbnormal = opt?.isAbnormal || false
          } else if (test.testType === 'range') {
            displayValue = `${value} ${test.unit || ''}`
            const range = test.ranges?.find(
              (r) => (r.min === null || value >= r.min) && (r.max === null || value < r.max)
            )
            isAbnormal = range?.isAbnormal || false
          } else if (test.testType === 'boolean') {
            displayValue = value === 'true' || value === true ? 'Yes' : 'No'
            isAbnormal = (value === 'true' || value === true) && (test.positiveIsAbnormal || false)
          } else if (test.testType === 'multiselect' && Array.isArray(value)) {
            const labels = test.options
              ?.filter((o) => value.includes(o.value))
              .map((o) => o.labelKo)
            displayValue = labels?.join(', ') || value.join(', ')
            isAbnormal = test.options?.some((o) => value.includes(o.value) && o.isAbnormal) || false
          }

          if (!displayValue) return null

          return (
            <div key={test.testID} className="group flex flex-col space-y-1">
              <span className="text-[11px] font-medium text-slate-500">{test.testNameKo}</span>
              <div
                className={`text-xs p-2 rounded-md border ${
                  isAbnormal
                    ? 'bg-red-50 border-red-100 text-red-700 font-medium'
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                {displayValue}
              </div>
            </div>
          )
        })}
      </div>

      {/* Memo */}
      {prevData.organ_memo && (
        <div className="pt-2 border-t mt-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Memo</span>
          <div className="text-[11px] text-slate-600 bg-amber-50 p-2 rounded-md border border-amber-100 italic">
            {prevData.organ_memo}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React from 'react'
import {
  organSections,
  Organ,
  isTestVisible,
  UltrasoundTestItem,
} from '@/constants/hospital/ultrasound/ultrasound_testref'
import { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Props {
  organ: Organ
  organData: UltrasoundChartOrgan
  species?: string
  onUpdate: (data: UltrasoundChartOrgan) => void
}

export default function UltrasoundDynamicForm({ organ, organData, species, onUpdate }: Props) {
  const section = organSections.find(s => s.organ === organ)

  if (!section) {
    return <div className="p-4 text-slate-500">알 수 없는 장기입니다.</div>
  }

  const { statusGate, tests } = section
  const findings = (organData.findings_data as Record<string, any>) || {}

  const handleStatusChange = (value: string) => {
    onUpdate({
      ...organData,
      status: value,
      // 정상이나 미검사로 변경 시 기존 findings 초기화 방침이라면 여기서 초기화 가능
      // 여기서는 유연성을 위해 상태만 변경
    })
  }

  const handleFindingChange = (testID: string, value: any) => {
    onUpdate({
      ...organData,
      findings_data: {
        ...findings,
        [testID]: value,
      },
    })
  }

  // --- 렌더링 헬퍼 ---
  const renderTestInput = (test: UltrasoundTestItem) => {
    const value = findings[test.testID]

    switch (test.testType) {
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleFindingChange(test.testID, val)}
          >
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent>
              {test.options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span className={opt.isAbnormal ? 'text-red-600 font-medium' : ''}>
                      {opt.labelKo}
                    </span>
                    {opt.isAbnormal && (
                      <Badge variant="outline" className="text-[10px] py-0 border-red-200 text-red-500 bg-red-50/50">
                        Abnormal
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleFindingChange(test.testID, val)}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${test.testID}-true`} />
              <Label htmlFor={`${test.testID}-true`} className={test.positiveIsAbnormal ? 'text-red-600 font-medium' : ''}>
                {test.positiveResultTextKo || '관찰됨'}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${test.testID}-false`} />
              <Label htmlFor={`${test.testID}-false`} className={!test.positiveIsAbnormal ? '' : 'text-slate-600'}>
                {test.negativeResultTextKo || '관찰 안됨'}
              </Label>
            </div>
          </RadioGroup>
        )

      case 'range': {
        let rangeText = ''
        if (species && test.normalRange) {
          const ref = species === 'canine' ? test.normalRange.dog : species === 'feline' ? test.normalRange.cat : null
          if (ref) {
            const minStr = ref.min !== undefined ? ref.min : 0
            const maxStr = ref.max !== undefined ? ref.max : '∞'
            rangeText = `참고범위: ${minStr} ~ ${maxStr} ${test.unit || ''}`
          }
        }
        return (
          <div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                className="w-32"
                value={value || ''}
                onChange={(e) => handleFindingChange(test.testID, e.target.value ? Number(e.target.value) : null)}
                placeholder="측정값"
              />
              <span className="text-sm text-slate-500">{test.unit}</span>
            </div>
            {rangeText && (
              <p className="text-[10px] text-slate-400 mt-1">{rangeText}</p>
            )}
          </div>
        )
      }

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {test.options.map(opt => {
              const isChecked = selectedValues.includes(opt.value)
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded border border-transparent hover:border-slate-200">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFindingChange(test.testID, [...selectedValues, opt.value])
                      } else {
                        handleFindingChange(test.testID, selectedValues.filter((v: string) => v !== opt.value))
                      }
                    }}
                  />
                  <span className={opt.isAbnormal ? 'text-red-600' : 'text-slate-700'}>
                    {opt.labelKo}
                  </span>
                </label>
              )
            })}
          </div>
        )

      default:
        return <div className="text-xs text-slate-400">지원되지 않는 타입: {test.testType}</div>
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* 장기 헤더 */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">{section.organNameKo} <span className="text-sm font-normal text-slate-400 uppercase ml-2">{section.organName}</span></h2>
      </div>

      {/* Level 0: Status Gate */}
      <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
        <div>
          <Label className="text-base font-bold text-slate-800">{statusGate.testNameKo}</Label>
          <p className="text-xs text-slate-500 mt-1">장기의 전반적인 상태를 먼저 선택해주세요.</p>
        </div>
        <RadioGroup
          value={organData.status || 'not_examined'}
          onValueChange={handleStatusChange}
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not_examined" id="not_examined" />
            <Label htmlFor="not_examined" className="text-slate-500 cursor-pointer">미검사 (Not Examined)</Label>
          </div>
          {statusGate.options.map(opt => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`status-${opt.value}`} />
              <Label 
                htmlFor={`status-${opt.value}`} 
                className={`cursor-pointer ${opt.value === statusGate.abnormalValue ? 'text-red-600 font-bold' : 'text-slate-700 font-medium'}`}
              >
                {opt.labelKo}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Level 1~3: Dynamic Test Items (Only shown if abnormal) */}
      {organData.status === statusGate.abnormalValue && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {tests.filter(test => isTestVisible(test, findings)).map(test => {
            const isSubLevel = test.displayLevel > 1
            
            return (
              <div 
                key={test.testID} 
                className={`bg-white p-5 rounded-lg border shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 transition-all ${isSubLevel ? 'ml-8 sm:ml-12 border-l-4 border-l-blue-400' : ''}`}
              >
                <div className="sm:w-1/3 shrink-0">
                  <Label className="text-sm font-bold text-slate-800">{test.testNameKo}</Label>
                  <p className="text-xs text-slate-400 mt-0.5">{test.testName}</p>
                  {test.required && (
                    <Badge variant="secondary" className="mt-2 text-[10px] bg-slate-100 text-slate-500">기본 검사</Badge>
                  )}
                  {test.note && (
                    <p className="text-[10px] text-blue-600 mt-2 bg-blue-50 p-1.5 rounded">{test.note}</p>
                  )}
                </div>
                <div className="flex-1 w-full">
                  {renderTestInput(test)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

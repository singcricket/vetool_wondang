'use client'

import React from 'react'
import {
  organSections,
  Organ,
  isTestVisible,
  UltrasoundTestItem,
} from '@/constants/hospital/ultrasound'
import { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

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

  const handleMemoChange = (value: string) => {
    onUpdate({
      ...organData,
      organ_memo: value,
    })
  }

  // --- 렌더링 헬퍼 ---
  const renderTestInput = (test: UltrasoundTestItem) => {
    const value = findings[test.testID]

    switch (test.testType) {
      case 'select':
        return (
          <>
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
              <SelectItem value="other">
                <span className="text-slate-500 italic text-xs">기타 (직접 입력)</span>
              </SelectItem>
            </SelectContent>
          </Select>
          {value === 'other' && (
            <Input
              className="mt-2"
              placeholder="내용을 직접 입력하세요..."
              value={findings[test.testID + '_other'] || ''}
              onChange={(e) => handleFindingChange(test.testID + '_other', e.target.value)}
            />
          )}
          </>
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
        if (test.normalRange) {
          const dogRef = test.normalRange.dog
          const catRef = test.normalRange.cat
          if (species === 'canine' && dogRef) {
            const minStr = dogRef.min !== undefined ? dogRef.min : 0
            const maxStr = dogRef.max !== undefined ? dogRef.max : '∞'
            rangeText = `참고범위 (개): ${minStr} ~ ${maxStr} ${test.unit || ''}`
          } else if (species === 'feline' && catRef) {
            const minStr = catRef.min !== undefined ? catRef.min : 0
            const maxStr = catRef.max !== undefined ? catRef.max : '∞'
            rangeText = `참고범위 (고양이): ${minStr} ~ ${maxStr} ${test.unit || ''}`
          } else if (dogRef || catRef) {
            const parts = []
            if (dogRef) parts.push(`개: ≤${dogRef.max ?? '∞'}`)
            if (catRef) parts.push(`고양이: ≤${catRef.max ?? '∞'}`)
            rangeText = `참고범위 — ${parts.join(', ')} ${test.unit || ''}`
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
          <>
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
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded border border-dashed border-slate-200 hover:border-slate-400">
              <Checkbox
                checked={selectedValues.includes('other')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleFindingChange(test.testID, [...selectedValues, 'other'])
                  } else {
                    handleFindingChange(test.testID, selectedValues.filter((v: string) => v !== 'other'))
                  }
                }}
              />
              <span className="text-slate-500 italic">기타</span>
            </label>
          </div>
          {selectedValues.includes('other') && (
            <Input
              className="mt-2"
              placeholder="기타 내용을 입력하세요..."
              value={findings[test.testID + '_other'] || ''}
              onChange={(e) => handleFindingChange(test.testID + '_other', e.target.value)}
            />
          )}
          </>
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

      {/* Level 1~3: Dynamic Test Items */}
      {(organData.status === 'abnormal' || organData.status === 'absent' || organData.status === 'normal') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {organData.status === 'normal' && (
            <p className="text-xs text-slate-400 -mb-2">
              정상 소견이나 참고치 기록이 필요한 항목을 선택적으로 입력할 수 있습니다.
            </p>
          )}
          {tests.filter(test => isTestVisible(test, { ...findings, [statusGate.testID]: organData.status })).map(test => {
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

      {/* 장기별 메모 */}
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-bold text-slate-800">장기별 특이사항 (수의사 메모)</Label>
          <Badge variant="outline" className="bg-white">선택사항</Badge>
        </div>
        <Textarea 
          placeholder="해당 장기에 대한 추가적인 관찰 내용이나 의견을 자유롭게 적어주세요."
          className="min-h-[120px] bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400"
          value={organData.organ_memo || ''}
          onChange={(e) => handleMemoChange(e.target.value)}
        />
      </div>
    </div>
  )
}

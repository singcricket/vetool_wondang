'use client'

import React from 'react'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import type { NeuroDomainSection, NeuroTestItem, SelectNeuroTest, MultiSelectNeuroTest, BooleanNeuroTest } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface Props {
  domain: NeuroDomainSection
  results: Record<string, string | string[]>
  onUpdate: (newResults: Record<string, string | string[]>) => void
}

export default function NeuroDynamicForm({ domain, results, onUpdate }: Props) {
  // Domain Gate check
  const isGateOpen = neuroReference.isDomainVisible(domain, results as Record<string, string>)
  const gateTest = domain.statusGate

  const handleGateChange = (checked: boolean) => {
    if (checked) {
      // 이상 소견 있음 → gate만 abnormal로 전환
      onUpdate({ ...results, [gateTest.testID]: gateTest.abnormalValue })
    } else {
      // 정상으로 전환 → gate + 해당 domain의 모든 하위 검사 결과 초기화
      const testIDsInDomain = domain.tests.map((t) => t.testID)
      const cleanedResults = { ...results }
      for (const id of testIDsInDomain) {
        delete cleanedResults[id]
      }
      cleanedResults[gateTest.testID] = gateTest.normalValue
      onUpdate(cleanedResults)
    }
  }

  const handleChange = (testID: string, value: string | string[]) => {
    onUpdate({ ...results, [testID]: value })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-lg font-bold text-slate-800">{domain.domainNameKo}</h2>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-md flex-1">
            <Switch 
              checked={isGateOpen} 
              onCheckedChange={handleGateChange} 
              id={`gate-${domain.domain}`}
            />
            <Label htmlFor={`gate-${domain.domain}`} className="font-semibold text-base cursor-pointer">
              {isGateOpen ? '이상 소견 있음 (Abnormal)' : '정상 (Normal)'}
            </Label>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleGateChange(false)}
            className="ml-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 gap-1"
            title="영역 초기화"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">초기화</span>
          </Button>
        </div>
      </div>

      {isGateOpen && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {domain.tests.filter(test => neuroReference.isNeuroTestVisible(test, results)).map(test => (
            <div key={test.testID} id={`test-${test.testID}`} className="bg-white p-4 rounded-lg border shadow-sm">
              <Label className="text-base font-semibold mb-1 block">
                {test.testNameKo}
                <span className="text-sm font-normal text-slate-500 ml-1.5 italic">({test.testName})</span>
                {test.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {test.howTo && <p className="text-xs text-slate-500 mb-3">{test.howTo}</p>}
              
              <div className="mt-3">
                {renderTestInput(test, results[test.testID], (val) => handleChange(test.testID, val))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function renderTestInput(
  test: NeuroTestItem, 
  currentValue: string | string[] | undefined,
  onChange: (val: string | string[]) => void
) {
  switch (test.testType) {
    case 'select':
    case 'grade': {
      const options = test.testType === 'select' 
        ? (test as SelectNeuroTest).options 
        : (test as any).grades.map((g: any) => ({ value: String(g.grade), label: g.label, labelKo: g.labelKo }))
      
      return (
        <RadioGroup 
          value={currentValue as string || ''} 
          onValueChange={onChange}
          className="grid gap-2 sm:grid-cols-2"
        >
          {options.map((opt: any) => (
            <div key={opt.value} className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-md hover:bg-slate-100 transition-colors">
              <RadioGroupItem value={opt.value} id={`${test.testID}-${opt.value}`} />
              <Label htmlFor={`${test.testID}-${opt.value}`} className="cursor-pointer flex-1 font-medium">
                {opt.labelKo}
                <span className="text-[12px] font-normal text-slate-500 ml-1.5 italic">({opt.label})</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )
    }

    case 'multiselect': {
      const t = test as MultiSelectNeuroTest
      const currentArray = (currentValue as string[]) || []
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {t.options.map(opt => {
            const isChecked = currentArray.includes(opt.value)
            return (
              <div key={opt.value} className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-md hover:bg-slate-100 transition-colors">
                <Checkbox 
                  id={`${test.testID}-${opt.value}`} 
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...currentArray, opt.value])
                    } else {
                      onChange(currentArray.filter(v => v !== opt.value))
                    }
                  }}
                />
                <Label htmlFor={`${test.testID}-${opt.value}`} className="cursor-pointer flex-1 font-medium">
                  {opt.labelKo}
                  <span className="text-[12px] font-normal text-slate-500 ml-1.5 italic">({opt.label})</span>
                </Label>
              </div>
            )
          })}
        </div>
      )
    }

    case 'boolean': {
      const t = test as BooleanNeuroTest
      // Since it's boolean, we'll use a simple radio with Yes/No
      return (
        <RadioGroup 
          value={currentValue as string || ''} 
          onValueChange={onChange}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-md min-w-[120px]">
            <RadioGroupItem value="true" id={`${test.testID}-true`} />
            <Label htmlFor={`${test.testID}-true`} className="cursor-pointer font-medium text-rose-600">
              {t.positiveResultTextKo}
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5 italic">({t.positiveResultText})</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-md min-w-[120px]">
            <RadioGroupItem value="false" id={`${test.testID}-false`} />
            <Label htmlFor={`${test.testID}-false`} className="cursor-pointer font-medium text-emerald-600">
              {t.negativeResultTextKo}
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5 italic">({t.negativeResultText})</span>
            </Label>
          </div>
        </RadioGroup>
      )
    }

    case 'range':
      // Simplified range handling as a text input for now
      return (
        <input 
          type="number" 
          value={currentValue as string || ''}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded-md px-3 py-2 w-full max-w-[200px]"
          placeholder="수치 입력"
        />
      )

    default:
      return <div>Unsupported test type</div>
  }
}

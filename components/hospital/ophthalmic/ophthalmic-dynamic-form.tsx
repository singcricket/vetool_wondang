'use client'

import React from 'react'
import { ophthalmicReference } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import type { 
  OphDomainSection, 
  OphTestItem, 
  SelectOphTest, 
  MultiSelectOphTest, 
  BooleanOphTest,
  RangeOphTest,
  TextOphTest
} from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface Props {
  domain: OphDomainSection
  results: Record<string, string | string[]>
  onUpdate: (newResults: Record<string, string | string[]>) => void
}

export default function OphthalmicDynamicForm({ domain, results, onUpdate }: Props) {
  const isGateOpen = results[domain.statusGate.testID] === domain.statusGate.abnormalValue
  const gateTest = domain.statusGate

  const handleGateChange = (checked: boolean) => {
    if (checked) {
      onUpdate({ ...results, [gateTest.testID]: gateTest.abnormalValue })
    } else {
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

  // Group tests by eye for bilateral display
  const groupedTests = useMemo(() => {
    const od: OphTestItem[] = []
    const os: OphTestItem[] = []
    const ou: OphTestItem[] = []
    const global: OphTestItem[] = []

    domain.tests.forEach(test => {
      // Check visibility if dependsOn exists
      if (test.dependsOn) {
        const deps = Array.isArray(test.dependsOn) ? test.dependsOn : [test.dependsOn]
        const isVisible = deps.every(dep => {
          const val = results[dep.testID]
          return Array.isArray(val) 
            ? dep.triggerValues.some(tv => val.includes(tv))
            : dep.triggerValues.includes(val as string)
        })
        if (!isVisible) return
      }

      if (test.eye === 'OD') od.push(test)
      else if (test.eye === 'OS') os.push(test)
      else if (test.eye === 'OU') ou.push(test)
      else global.push(test)
    })

    return { od, os, ou, global }
  }, [domain.tests, results])

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Domain Header & Gate */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">{domain.domainNameKo}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleGateChange(false)}
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 gap-1 h-8 px-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs font-semibold">이 영역 초기화</span>
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <Switch 
            checked={isGateOpen} 
            onCheckedChange={handleGateChange} 
            id={`gate-${domain.domain}`}
            className="data-[state=checked]:bg-blue-600"
          />
          <Label htmlFor={`gate-${domain.domain}`} className="font-bold text-lg cursor-pointer flex-1">
            {isGateOpen ? '이상 소견 있음 (Abnormal Signs Present)' : '정상 또는 특이사항 없음 (Normal / Unremarkable)'}
          </Label>
        </div>
      </div>

      {isGateOpen && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300 pb-12">
          
          {/* Global / OU Tests (Full Width) */}
          {[...groupedTests.global, ...groupedTests.ou].length > 0 && (
            <div className="space-y-4">
              {[...groupedTests.global, ...groupedTests.ou].map(test => (
                <TestCard key={test.testID} test={test} value={results[test.testID]} onChange={(val) => handleChange(test.testID, val)} />
              ))}
            </div>
          )}

          {/* OD / OS Tests (Side by Side) */}
          {(groupedTests.od.length > 0 || groupedTests.os.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OD Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2 h-6 bg-blue-500 rounded-full" />
                  <h3 className="text-lg font-bold text-blue-700">OD (우안)</h3>
                </div>
                {groupedTests.od.map(test => (
                  <TestCard key={test.testID} test={test} value={results[test.testID]} onChange={(val) => handleChange(test.testID, val)} side="OD" />
                ))}
              </div>

              {/* OS Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2 h-6 bg-orange-500 rounded-full" />
                  <h3 className="text-lg font-bold text-orange-700">OS (좌안)</h3>
                </div>
                {groupedTests.os.map(test => (
                  <TestCard key={test.testID} test={test} value={results[test.testID]} onChange={(val) => handleChange(test.testID, val)} side="OS" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TestCard({ test, value, onChange, side }: { test: OphTestItem, value: any, onChange: (val: any) => void, side?: 'OD' | 'OS' }) {
  return (
    <div className={cn(
      "bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md",
      side === 'OD' ? 'border-l-4 border-l-blue-400' : side === 'OS' ? 'border-l-4 border-l-orange-400' : 'border-slate-200'
    )}>
      <Label className="text-base font-bold mb-1.5 block text-slate-800">
        {test.testNameKo}
        <span className="text-sm font-medium text-slate-400 ml-2 italic leading-relaxed">({test.testName})</span>
        {test.required && <span className="text-rose-500 ml-1.5 font-black">*</span>}
      </Label>
      {test.howTo && <p className="text-[11px] text-slate-400 mb-4 bg-slate-50 p-2 rounded-md border border-dashed">{test.howTo}</p>}
      
      <div className="mt-2">
        {renderTestInput(test, value, onChange)}
      </div>
    </div>
  )
}

function renderTestInput(test: OphTestItem, value: any, onChange: (val: any) => void) {
  switch (test.testType) {
    case 'select':
      return (
        <RadioGroup value={value || ''} onValueChange={onChange} className="grid gap-2">
          {test.options.map((opt) => (
            <div 
              key={opt.value} 
              className={cn(
                "flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group",
                value === opt.value ? (opt.isAbnormal ? 'border-rose-300 bg-rose-50/30' : 'border-blue-300 bg-blue-50/30') : 'border-slate-100'
              )}
              onClick={() => onChange(opt.value)}
            >
              <RadioGroupItem value={opt.value} id={`${test.testID}-${opt.value}`} />
              <Label htmlFor={`${test.testID}-${opt.value}`} className="cursor-pointer flex-1 font-bold text-[15px] text-slate-700">
                {opt.labelKo}
                <span className="text-[13px] font-medium text-slate-400 ml-2 italic group-hover:text-slate-500 transition-colors">({opt.label})</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case 'multiselect':
      const currentArray = (value as string[]) || []
      return (
        <div className="grid gap-2">
          {test.options.map(opt => {
            const isChecked = currentArray.includes(opt.value)
            return (
              <div 
                key={opt.value} 
                className={cn(
                  "flex items-center space-x-3 border p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group",
                  isChecked ? (opt.isAbnormal ? 'border-rose-300 bg-rose-50/30' : 'border-blue-300 bg-blue-50/30') : 'border-slate-100'
                )}
                onClick={() => {
                  if (isChecked) onChange(currentArray.filter(v => v !== opt.value))
                  else onChange([...currentArray, opt.value])
                }}
              >
                <Checkbox 
                  id={`${test.testID}-${opt.value}`} 
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...currentArray, opt.value])
                    else onChange(currentArray.filter(v => v !== opt.value))
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label htmlFor={`${test.testID}-${opt.value}`} className="cursor-pointer flex-1 font-bold text-[15px] text-slate-700">
                  {opt.labelKo}
                  <span className="text-[13px] font-medium text-slate-400 ml-2 italic group-hover:text-slate-500 transition-colors">({opt.label})</span>
                </Label>
              </div>
            )
          })}
        </div>
      )

    case 'boolean':
      return (
        <div className="flex gap-4">
          <div 
            className={cn(
              "flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-all flex-1",
              value === 'true' ? 'border-rose-500 bg-rose-50 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
            )}
            onClick={() => onChange('true')}
          >
            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", value === 'true' ? 'border-rose-500 bg-rose-500' : 'border-slate-300')}>
              {value === 'true' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div>
              <p className={cn("font-bold text-[15px]", value === 'true' ? 'text-rose-700' : 'text-slate-600')}>{test.positiveLabelKo}</p>
              <p className="text-[12px] text-slate-400 italic">({test.positiveLabel})</p>
            </div>
          </div>
          
          <div 
            className={cn(
              "flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-all flex-1",
              value === 'false' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
            )}
            onClick={() => onChange('false')}
          >
            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", value === 'false' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300')}>
              {value === 'false' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div>
              <p className={cn("font-bold text-[15px]", value === 'false' ? 'text-emerald-700' : 'text-slate-600')}>{test.negativeLabelKo}</p>
              <p className="text-[12px] text-slate-400 italic">({test.negativeLabel})</p>
            </div>
          </div>
        </div>
      )

    case 'range':
      return (
        <div className="flex items-center gap-3">
          <Input 
            type="number" 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full max-w-[150px] h-10 font-bold text-lg"
            placeholder="수치 입력"
          />
          <span className="text-slate-500 font-medium">{test.unit}</span>
        </div>
      )

    case 'text':
      return (
        <Textarea 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          placeholder={test.placeholder || "내용을 입력하세요..."}
          className="resize-none min-h-[100px] text-base"
        />
      )

    default:
      return <div className="text-slate-300 text-xs italic py-4">지원되지 않는 검사 타입입니다.</div>
  }
}

// React useMemo needs to be imported or handled
import { useMemo } from 'react'

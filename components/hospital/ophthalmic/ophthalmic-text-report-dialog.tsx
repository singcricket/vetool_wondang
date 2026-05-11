'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Type, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { ophthalmicReference } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import type { OphthalmicChartDetail } from '@/types/hospital/ophthalmic-type'
import type { OphEngineOutput } from '@/constants/hospital/ophthalmic/ophthalmic_ref'

interface Props {
  chartDetail: OphthalmicChartDetail
  results: Record<string, string | string[]>
  engineOutput: OphEngineOutput
}

export default function OphthalmicTextReportDialog({ chartDetail, results, engineOutput }: Props) {
  const [copied, setCopied] = useState(false)

  const generateTextReport = () => {
    let report = `[Ophthalmic Examination Report]\n`
    report += `Date: ${chartDetail.chart_date}\n`
    report += `Patient: ${chartDetail.patient?.name} (${chartDetail.patient?.breed})\n`
    if (chartDetail.evaluator_name) report += `Evaluator: ${chartDetail.evaluator_name}\n`
    report += `------------------------------------------\n\n`

    // 1. Vision & Critical
    report += `[Summary & Alerts]\n`
    report += `- Vision OD: ${engineOutput.visionStatus.od.toUpperCase()}\n`
    report += `- Vision OS: ${engineOutput.visionStatus.os.toUpperCase()}\n`
    if (engineOutput.criticalFindings.length > 0) {
      report += `- CRITICAL FINDINGS: ${engineOutput.criticalFindings.join(', ')}\n`
    }
    report += `\n`

    // 2. Examination Details (SOAP Style)
    report += `[Examination Details]\n`
    ophthalmicReference.domainSections.forEach(section => {
      const sectionLines: string[] = []
      section.tests.forEach(test => {
        const val = results[test.testID]
        if (val === undefined || val === null || val === '') return

        let displayValue = ''
        if (test.testType === 'select') {
          const opt = test.options.find(o => o.value === val)
          displayValue = opt ? opt.labelKo : String(val)
        } else if (test.testType === 'multiselect' && Array.isArray(val)) {
          displayValue = val.map(v => test.options.find(o => o.value === v)?.labelKo || v).join(', ')
        } else if (test.testType === 'boolean') {
          displayValue = val === 'true' ? test.positiveLabelKo : test.negativeLabelKo
        } else {
          displayValue = String(val)
        }

        sectionLines.push(`  - ${test.testNameKo} (${test.eye}): ${displayValue}`)
      })

      if (sectionLines.length > 0) {
        report += `${section.domainNameKo}:\n${sectionLines.join('\n')}\n`
      }
    })
    report += `\n`

    // 3. Assessment
    report += `[Assessment & DDx]\n`
    if (engineOutput.diagnoses.length > 0) {
      engineOutput.diagnoses
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .forEach(diag => {
          report += `- ${diag.rule.diagnosisNameKo} (${diag.confidenceScore}%)\n`
        })
    } else {
      report += `- No specific diagnosis matched.\n`
    }
    
    if (engineOutput.activeSigns.length > 0) {
      report += `Active Signs: ${engineOutput.activeSigns.join(', ')}\n`
    }

    return report
  }

  const handleCopy = () => {
    const text = generateTextReport()
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('텍스트 리포트가 클립보드에 복사되었습니다.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50" title="텍스트 리포트 복사">
          <Type className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-600" />
            텍스트 리포트 (복사용)
          </DialogTitle>
          <Button onClick={handleCopy} size="sm" className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? '복사됨' : '클립보드 복사'}
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-4">
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {generateTextReport()}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}

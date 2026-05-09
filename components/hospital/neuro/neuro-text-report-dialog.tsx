'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Copy, Check, Type } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import type { NeuroChartDetail } from '@/types/hospital/neuro-type'
import { toast } from 'sonner'

interface Props {
  chartDetail: NeuroChartDetail
  results: Record<string, string | string[]>
  localisations: any
}

export default function NeuroTextReportDialog({ chartDetail, results, localisations }: Props) {
  const [text, setText] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const generateTextReport = () => {
    const patient = chartDetail.patient
    const { 
      localisationCandidates: candidates = [], 
      detectedSyndromes: syndromes = [],
      cerebralLateralisation = null 
    } = localisations

    let report = `[신경학적 검사 리포트]\n`
    report += `환자명: ${patient?.name || '-'}\n`
    report += `품종: ${patient?.species === 'cat' ? '고양이' : '개'} / ${patient?.breed || '-'}\n`
    report += `성별/나이: ${patient?.gender === 'male' ? '수컷' : '암컷'} / ${patient?.birth || '-'}\n`
    report += `검사일: ${chartDetail.chart_date}\n`
    report += `----------------------------------------\n\n`

    report += `[검사 소견]\n`
    
    neuroReference.domainSections.forEach((section) => {
      const sectionResults: string[] = []
      
      section.tests.forEach((test) => {
        const val = results[test.testID]
        if (val === undefined || val === null || val === '') return

        let displayValue = ''
        if (test.testType === 'select' || test.testType === 'grade') {
          const options = (test as any).options || (test as any).grades?.map((g: any) => ({ value: String(g.grade), label: g.label, labelKo: g.labelKo }))
          const opt = options?.find((opt: any) => opt.value === val)
          displayValue = opt ? `${opt.labelKo} (${opt.label})` : String(val)
        } else if (test.testType === 'multiselect' && Array.isArray(val)) {
          const options = (test as any).options
          displayValue = val.map(v => {
            const opt = options.find((opt: any) => opt.value === v)
            return opt ? `${opt.labelKo} (${opt.label})` : v
          }).join(', ')
        } else if (test.testType === 'boolean') {
          const t = test as any
          displayValue = val === 'true' 
            ? `${t.positiveResultTextKo} (${t.positiveResultText})` 
            : `${t.negativeResultTextKo} (${t.negativeResultText})`
        } else {
          displayValue = String(val)
        }

        sectionResults.push(`- ${test.testNameKo} (${test.testName}): ${displayValue}`)
      })

      if (sectionResults.length > 0) {
        report += `<${section.domainNameKo}>\n`
        report += sectionResults.join('\n') + '\n\n'
      }
    })

    report += `----------------------------------------\n`
    report += `[종합 분석 결과]\n`

    if (syndromes.length > 0) {
      report += `\n<감지된 증후군>\n`
      syndromes.forEach((syn: any) => {
        report += `• ${syn.nameKo}: ${syn.interpretationKo}\n`
      })
    }

    if (candidates.length > 0) {
      report += `\n<예상 병변 위치>\n`
      candidates.forEach((loc: any) => {
        report += `• ${loc.locationNameKo || loc.location} (${loc.confidenceScore}% 매치)\n`
      })
    }

    if (cerebralLateralisation && cerebralLateralisation.hemisphere !== 'undetermined') {
      report += `\n<대뇌 반구 편측화>\n`
      const side = cerebralLateralisation.hemisphere === 'left' ? '좌측' : cerebralLateralisation.hemisphere === 'right' ? '우측' : '양측성'
      report += `• ${side} 반구 병변 의심 (${cerebralLateralisation.confidenceScore}% 신뢰도)\n`
      report += `  근거: ${cerebralLateralisation.summaryKo.split('\n')[1] || ''}\n`
    }

    return report.trim()
  }

  // 다이얼로그 열릴 때마다 텍스트 생성
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setText(generateTextReport())
      setIsCopied(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast.success('클립보드에 복사되었습니다.')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast.error('복사에 실패했습니다.')
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50">
          <Type className="h-4 w-4" />
          TXT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            텍스트 리포트 에디터
          </DialogTitle>
          <Button 
            onClick={handleCopy} 
            variant={isCopied ? "default" : "outline"}
            size="sm" 
            className="gap-2"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? '복사 완료' : '복사하기'}
          </Button>
        </DialogHeader>
        
        <div className="mt-4">
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            className="min-h-[500px] font-mono text-sm leading-relaxed resize-none p-4"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          * 텍스트를 자유롭게 수정한 뒤 복사하여 외부 차트 등에 활용할 수 있습니다.
        </p>
      </DialogContent>
    </Dialog>
  )
}

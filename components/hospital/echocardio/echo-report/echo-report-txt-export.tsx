'use client'

import { useState } from 'react'
import { FileText, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { EchoChartDetail, EchoSection } from '@/types/echocardio/echocardio-type'
import { getMmodeRef, getCatMmodeRef } from '@/constants/hospital/echocardio/mmode-ref-dog'

interface EchoReportTxtExportProps {
  patientName: string
  chartDetail: EchoChartDetail
  sortedSections: EchoSection[]
  reportData: any
}

export default function EchoReportTxtExport({
  patientName,
  chartDetail,
  sortedSections,
  reportData,
}: EchoReportTxtExportProps) {
  const [txtContent, setTxtContent] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // 텍스트 리포트 생성
  function handleOpenTxtDialog() {
    const lines: string[] = []
    lines.push(`[심초음파 결과지 - ${patientName}]`)
    lines.push(`검사일: ${chartDetail.exam_date}`)
    
    const bwVal = chartDetail.results.find(r => r.keyword_id === 'BW_kg')?.value
    const bwKg = bwVal ? parseFloat(bwVal) : 0
    const species = (chartDetail.patient.species?.toLowerCase() === 'feline' ? 'feline' : 'canine') as 'canine' | 'feline'

    if (bwKg > 0) lines.push(`체중: ${bwKg} kg`)
    
    lines.push('')
    lines.push('----------------------------------')

    sortedSections.forEach((sec) => {
      const group = reportData.bySection[sec]
      if (!group || group.items.length === 0) return

      lines.push(`■ ${group.label}`)
      group.items.forEach((it: any) => {
        const { meta, value, computed, keyword_id } = it
        const unit = meta.unit ? ` ${meta.unit}` : ''
        const resultText = computed?.result ? ` [${computed.result}]` : ''
        const commentText = (computed?.comment && computed.comment !== computed.result) 
          ? ` (${computed.comment})` 
          : ''

        // M-mode 참조값 동적 계산
        let displayRef = ''
        if (bwKg > 0) {
          if (meta.testType === 'mmode_range' && meta.refTable === 'mmoderef_dog' && species === 'canine') {
            const ref = getMmodeRef(bwKg, keyword_id)
            if (ref) displayRef = ` (Ref: ${ref[0]} - ${ref[1]})`
          } else if (meta.testType === 'mmode_formula' && species === 'feline') {
            const ref = getCatMmodeRef(keyword_id as any, bwKg)
            if (ref) displayRef = ` (Ref: ${ref[0].toFixed(2)} - ${ref[1].toFixed(2)})`
          }
        }

        lines.push(`  - ${meta.keywordName}: ${value}${unit}${displayRef}${resultText}${commentText}`)
      })
      lines.push('')
    })

    if (chartDetail.memo) {
      lines.push('----------------------------------')
      lines.push('■ 종합 소견 (General Review)')
      lines.push(chartDetail.memo)
    }

    setTxtContent(lines.join('\n'))
    setIsCopied(false)
  }

  async function handleCopyToClipboard() {
    try {
      await navigator.clipboard.writeText(txtContent)
      setIsCopied(true)
      toast.success('클립보드에 복사되었습니다')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <Dialog onOpenChange={(open) => open && handleOpenTxtDialog()}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          TXT Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            텍스트 내보내기 (일반 차트용)
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="mb-2 text-xs text-muted-foreground">
            생성된 텍스트를 편집하여 일반 진료 차트에 붙여넣을 수 있습니다.
          </p>
          <Textarea
            value={txtContent}
            onChange={(e) => setTxtContent(e.target.value)}
            className="h-[400px] resize-none font-mono text-sm leading-relaxed"
          />
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <p className="text-[10px] text-muted-foreground">
            * 편집된 내용은 저장되지 않으며 내보내기용으로만 사용됩니다.
          </p>
          <Button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                클립보드 복사
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

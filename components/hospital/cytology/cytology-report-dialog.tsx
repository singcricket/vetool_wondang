'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Copy, Check, Image as ImageIcon, FileDown, Loader2 } from 'lucide-react'
import type { CytologyChartDetail } from '@/types/hospital/cytology-type'
import type { CytologyEngineOutput, CytologySampleType } from '@/constants/hospital/cytology/cytology-types'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'

const SAMPLE_LABELS: Record<CytologySampleType, string> = {
  otic: '귀도말 (Otic Swab)',
  skin_impression: '피부 인상도말 (Skin Impression)',
  skin_exudate: '피부 삼출물 도말 (Skin Exudate)',
  fecal: '분변염색 (Fecal Cytology)',
  vaginal: '질 세포진 (Vaginal Cytology)',
  conjunctival: '결막/각막 도말 (Conjunctival)',
  fna_skin: 'FNA - 피부/피하 (FNA Skin)',
  fna_lymph: 'FNA - 림프절 (FNA Lymph Node)',
  fna_organ: 'FNA - 내부 장기 (FNA Organ)',
  effusion: '체강액 (Effusion)',
  synovial: '관절액 (Synovial Fluid)',
  csf: '뇌척수액 (CSF)',
  bal: '기관지폐포세척액 (BAL)',
}

interface Props {
  chartDetail: CytologyChartDetail
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  engineOutput: CytologyEngineOutput | null
  aiSummary?: string | null
}

// ── Report text generator ─────────────────────────────────────

function generateReport(
  chartDetail: CytologyChartDetail,
  sampleType: CytologySampleType,
  findings: Record<string, string | string[]>,
  engineOutput: CytologyEngineOutput | null,
  aiSummary?: string | null,
): string {
  const lines: string[] = []
  const patient = chartDetail.patient
  const now = new Date().toLocaleDateString('ko-KR')

  lines.push('══════════════════════════════════════')
  lines.push('     세포학 검사 판독 보고서 (Cytology Report)')
  lines.push('══════════════════════════════════════')
  lines.push('')
  lines.push('[환자 정보]')
  lines.push(`이름: ${patient?.name ?? '-'}`)
  lines.push(`종/품종: ${patient?.species === 'cat' ? '고양이' : '개'} / ${patient?.breed ?? '-'}`)
  lines.push(`성별: ${patient?.gender ?? '-'}`)
  lines.push(`병원 번호: ${patient?.hos_patient_id ?? '-'}`)
  lines.push(`보호자: ${patient?.owner_name ?? '-'}`)
  lines.push('')
  lines.push('[검사 정보]')
  lines.push(`검체 종류: ${SAMPLE_LABELS[sampleType]}`)
  lines.push(`검사일: ${chartDetail.chart_date}`)
  lines.push(`보고일: ${now}`)
  lines.push(`판독의: ${chartDetail.evaluator?.name ?? '-'}`)

  const sampleDef = cytologyReference.getSampleDef(sampleType)
  if (sampleDef) lines.push(`염색법: ${sampleDef.stainMethods.join(', ')}`)

  lines.push('')
  lines.push('[소견]')

  if (Object.keys(findings).length === 0) {
    lines.push('(소견 없음)')
  } else if (sampleDef) {
    // Routine sample
    for (const section of sampleDef.sections) {
      const sectionFindings = section.tests
        .filter((t) => {
          const v = findings[t.testId]
          return v !== undefined && v !== '' && v !== 'none' && v !== 'absent' && v !== 'normal'
        })
        .map((t) => {
          const val = findings[t.testId]
          const opt = t.options?.find((o) => o.value === val)
          return `  ${t.label}: ${opt?.label ?? String(val)}`
        })
      if (sectionFindings.length > 0) {
        lines.push(`\n▸ ${section.label}`)
        sectionFindings.forEach((f) => lines.push(f))
      }
    }
  } else {
    // Specialist mode
    const QUALITY_LABELS: Record<string, string> = {
      sq_cellularity: '세포충실성', sq_hemodilution: '혈액 희석', sq_necrosis: '괴사',
    }
    const QUALITY_VALUE_LABELS: Record<string, string> = {
      low: '낮음', moderate: '중등도', high: '높음',
      none: '없음', mild: '경도', severe: '심함', present: '있음',
    }
    const qualityLines = Object.entries(QUALITY_LABELS)
      .filter(([id]) => findings[id] && findings[id] !== 'none')
      .map(([id, label]) => `  ${label}: ${QUALITY_VALUE_LABELS[findings[id] as string] ?? findings[id]}`)
    if (qualityLines.length) {
      lines.push('\n▸ 검체 품질')
      qualityLines.forEach((l) => lines.push(l))
    }

    const INFL_LABELS: Record<string, string> = {
      neutrophilic_pure: '호중구성 (비패혈성)', neutrophilic_septic: '호중구성 (패혈성)',
      macrophagic: '대식세포성', eosinophilic: '호산구성', lymphocytic: '림프구성', mixed: '혼합성',
    }
    const inflType = findings['infl_type'] as string
    const inflLines: string[] = []
    if (inflType && inflType !== 'none') inflLines.push(`  염증 유형: ${INFL_LABELS[inflType] ?? inflType}`)
    if (findings['infl_degenerate_neutrophils'] === 'true') inflLines.push('  변성 호중구: 있음')
    if (findings['infl_giant_cells'] === 'true') inflLines.push('  다핵 거대세포: 있음')
    if (findings['infl_plasma_cells'] === 'true') inflLines.push('  형질세포: 있음')
    if (inflLines.length) {
      lines.push('\n▸ 염증 평가')
      inflLines.forEach((l) => lines.push(l))
    }

    const identifiedRaw = findings['identified_cells']
    const identifiedCells: string[] = Array.isArray(identifiedRaw)
      ? identifiedRaw : identifiedRaw ? [identifiedRaw as string] : []
    if (identifiedCells.length > 0) {
      lines.push('\n▸ 세포 분류')
      cytologyReference.cellTypes
        .filter((c) => identifiedCells.includes(c.cellId))
        .forEach((cellDef) => {
          lines.push(`  [${cellDef.nameKo}]`)
          cellDef.morphTests.forEach((mt) => {
            const v = findings[mt.testId]
            if (!v || v === '' || v === 'none') return
            const opt = mt.options?.find((o) => o.value === v)
            lines.push(`    ${mt.label}: ${opt?.label ?? String(v)}`)
          })
        })
    }

    const MALIG_LABELS: Record<string, string> = {
      malig_criteria_1: '세포 크기 다형성 (Anisocytosis)',
      malig_criteria_2: '핵 크기 다형성 (Anisokaryosis)',
      malig_criteria_3: '다형성 핵소체 (Prominent nucleoli)',
      malig_criteria_4: '유사분열상 (Mitotic figures)',
      malig_criteria_5: '핵 이형성 (Nuclear molding)',
    }
    const maligLines = Object.entries(MALIG_LABELS)
      .filter(([id]) => findings[id] === 'true')
      .map(([, label]) => `  ✓ ${label}`)
    if (maligLines.length) {
      lines.push(`\n▸ 악성도 기준 (${maligLines.length}/5 충족)`)
      maligLines.forEach((l) => lines.push(l))
    }

    const clinicalFields: [string, string][] = [
      ['mass_location', '병변 위치'], ['mass_size', '종괴 크기'],
      ['clinical_context', '임상 상황'], ['stain_method', '염색 방법'],
      ['evaluator_comment', '판독자 소견'],
    ]
    const clinicalLines = clinicalFields
      .filter(([id]) => findings[id] && findings[id] !== '')
      .map(([id, label]) => `  ${label}: ${findings[id]}`)
    if (clinicalLines.length) {
      lines.push('\n▸ 임상 소견')
      clinicalLines.forEach((l) => lines.push(l))
    }
  }

  if (engineOutput) {
    lines.push('')
    lines.push('[판독 결론]')
    lines.push(cytologyReference.buildSummary(findings, sampleType, engineOutput))

    if (engineOutput.diagnoses.length > 0) {
      lines.push('')
      lines.push('[진단]')
      engineOutput.diagnoses.slice(0, 3).forEach((d, i) => {
        lines.push(`${i === 0 ? '주진단' : `감별 ${i}`}: ${d.rule.nameKo} (신뢰도 ${d.confidenceScore}%)`)
        if (d.rule.descriptionKo) lines.push(`  → ${d.rule.descriptionKo}`)
      })

      const topDx = engineOutput.diagnoses[0]
      if (topDx.rule.treatmentHintKo) {
        lines.push('')
        lines.push('[치료 방향]')
        lines.push(topDx.rule.treatmentHintKo)
      }
      if (topDx.rule.additionalTestsKo?.length) {
        lines.push('')
        lines.push('[추가 검사 권장]')
        topDx.rule.additionalTestsKo.forEach((t) => lines.push(`  - ${t}`))
      }
    }

    if (engineOutput.criticalFindings.length > 0) {
      lines.push('')
      lines.push('[중요 소견]')
      engineOutput.criticalFindings.forEach((f) => lines.push(f))
    }
  }

  if (aiSummary) {
    lines.push('')
    lines.push('[AI 보조 판독]')
    lines.push(aiSummary)
  }

  lines.push('')
  lines.push('──────────────────────────────────────')
  lines.push('본 보고서는 수의사의 임상 판단 하에 최종 진단하여야 합니다.')
  lines.push('══════════════════════════════════════')

  return lines.join('\n')
}

// ── Export helpers ────────────────────────────────────────────

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
}

function buildFilename(chartDetail: CytologyChartDetail, sampleType: CytologySampleType, ext: string): string {
  const name = chartDetail.patient?.name ?? 'report'
  const date = chartDetail.chart_date ?? new Date().toISOString().slice(0, 10)
  const sample = sampleType.replace('_', '-')
  return `cytology_${name}_${date}_${sample}.${ext}`
}

// ── Main component ────────────────────────────────────────────

export default function CytologyReportDialog({
  chartDetail,
  sampleType,
  findings,
  engineOutput,
  aiSummary,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)

  const report = generateReport(chartDetail, sampleType, findings, engineOutput, aiSummary)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPng = async () => {
    if (!printRef.current) return
    setExporting('png')
    try {
      const canvas = await captureElement(printRef.current)
      const link = document.createElement('a')
      link.download = buildFilename(chartDetail, sampleType, 'png')
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    if (!printRef.current) return
    setExporting('pdf')
    try {
      const canvas = await captureElement(printRef.current)
      const { jsPDF } = await import('jspdf')

      const imgData = canvas.toDataURL('image/png')
      const imgW = canvas.width
      const imgH = canvas.height

      // A4 dimensions in mm
      const pageW = 210
      const pageH = 297
      const margin = 10
      const contentW = pageW - margin * 2
      const contentH = (imgH * contentW) / imgW

      const pdf = new jsPDF({
        orientation: contentH > pageH - margin * 2 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // If content taller than one page, split across pages
      let yOffset = 0
      const pageContentH = pageH - margin * 2

      while (yOffset < contentH) {
        if (yOffset > 0) pdf.addPage()

        // srcY in canvas pixels for current page
        const srcY = (yOffset / contentH) * imgH
        const srcH = Math.min((pageContentH / contentH) * imgH, imgH - srcY)
        const renderH = (srcH / imgH) * contentH

        // Crop canvas for this page slice
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgW
        pageCanvas.height = srcH
        const ctx = pageCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH)

        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          contentW,
          renderH,
        )

        yOffset += pageContentH
      }

      pdf.save(buildFilename(chartDetail, sampleType, 'pdf'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <FileText className="h-4 w-4" />
          보고서
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-600" />
            세포학 판독 보고서
          </DialogTitle>
        </DialogHeader>

        {/* Report preview — this div is captured for export */}
        <div className="flex-1 overflow-auto rounded-lg border">
          <div
            ref={printRef}
            className="bg-white p-6 min-h-full"
          >
            {/* Export header (visible in PNG/PDF) */}
            <div className="mb-4 border-b-2 border-violet-600 pb-3">
              <h1 className="text-base font-bold text-violet-700">세포학 검사 판독 보고서</h1>
              <p className="text-xs text-gray-400">Cytology Examination Report</p>
            </div>
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-slate-700">
              {report}
            </pre>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPng}
              disabled={exporting !== null}
              className="gap-1.5 text-xs"
            >
              {exporting === 'png'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ImageIcon className="h-3.5 w-3.5" />}
              PNG 저장
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting !== null}
              className="gap-1.5 text-xs"
            >
              {exporting === 'pdf'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FileDown className="h-3.5 w-3.5" />}
              PDF 저장
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-green-600" />
              : <Copy className="h-3.5 w-3.5" />}
            {copied ? '복사됨' : '텍스트 복사'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

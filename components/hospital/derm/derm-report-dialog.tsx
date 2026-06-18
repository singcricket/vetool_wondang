'use client'

import { useRef, useState } from 'react'
import { FileText, FileDown, Image as ImageIcon, Loader2, Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import type { DermChartDetail, DermLesionGroup, DermLesionVisit, DermImage } from '@/types/hospital/derm-type'
import { SEVERITY_CONFIG, IMPROVEMENT_CONFIG, LESION_TYPES } from '@/types/hospital/derm-type'
import { getAnatomicalText } from '@/lib/utils/derm-anatomy'

interface VisitState {
  rawInput: string
  formalFindings: string
  lesionTypes: string[]
  aiAnalysis: DermLesionVisit['ai_analysis']
  severity: number | null
  improvement: DermLesionVisit['improvement']
  aiComparisonNotes: string | null
}

interface Props {
  chartDetail: DermChartDetail
  lesionGroups: DermLesionGroup[]
  visitsData: Record<string, VisitState>
  images: DermImage[]
  chiefComplaint: string
  notes: string
}

function calcAge(birth: string) {
  const today = new Date()
  const b = new Date(birth)
  const years = today.getFullYear() - b.getFullYear()
  const months = today.getMonth() - b.getMonth()
  return years === 0 ? `${Math.max(0, months + (months < 0 ? 12 : 0))}개월` : `${years}세`
}

async function captureElement(el: HTMLElement) {
  const html2canvas = (await import('html2canvas')).default
  return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wide w-16">{label}</span>
      <span className="text-xs text-slate-800 font-medium">{value || '-'}</span>
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-emerald-100 pb-1 mb-2">
      <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">{title}</span>
      {sub && <span className="text-[9px] font-bold text-slate-400">{sub}</span>}
    </div>
  )
}

function ReportBody({ chartDetail, lesionGroups, visitsData, images, chiefComplaint, notes }: Props) {
  const patient = chartDetail.patient
  const now = new Date().toLocaleDateString('ko-KR')
  const activeGroups = lesionGroups.filter((g) => g.status === 'active')

  return (
    <div className="bg-white text-slate-900 font-sans" style={{ width: '100%', fontSize: 12 }}>
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 rounded-lg shrink-0">
            <Microscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">피부과 진료 보고서</h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Veterinary Dermatology Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Report Date</p>
          <p className="text-xs font-semibold text-slate-700">{now}</p>
        </div>
      </div>

      {/* Patient & Exam */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <SectionHeader title="환자 정보" sub="Patient Info" />
          <InfoRow label="이름" value={patient?.name ?? '-'} />
          <InfoRow label="종/품종" value={patient ? `${patient.species === 'cat' ? '고양이' : '개'} / ${patient.breed}` : '-'} />
          <InfoRow label="성별" value={patient?.gender ?? '-'} />
          <InfoRow label="나이" value={patient?.birth ? calcAge(patient.birth) : '-'} />
          <InfoRow label="보호자" value={patient?.owner_name ?? '-'} />
        </div>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <SectionHeader title="진료 정보" sub="Visit Info" />
          <InfoRow label="진료일" value={chartDetail.chart_date ?? '-'} />
          <InfoRow label="방문유형" value={chartDetail.visit_type === 'followup' ? '재진' : '초진'} />
          <InfoRow label="판독의" value={chartDetail.evaluator?.name ?? '-'} />
          {chiefComplaint && <InfoRow label="주증상" value={chiefComplaint} />}
        </div>
      </div>

      {/* Lesion groups */}
      {activeGroups.map((group) => {
        const visit = visitsData[group.id]
        if (!visit) return null
        const groupImgs = images.filter((img) => img.lesion_group_id === group.id && img.image_type === 'detail')

        return (
          <div key={group.id} className="mb-4 rounded-lg overflow-hidden border-2" style={{ borderColor: group.group_color ?? '#e2e8f0' }}>
            {/* Group header */}
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ background: `${group.group_color}20` }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white"
                style={{ background: group.group_color ?? '#6b7280' }}
              >
                {group.group_label}
              </span>
              <div>
                <span className="text-xs font-black text-slate-800">{group.group_label}그룹</span>
                {(() => {
                  const loc = getAnatomicalText(group.marker_data ?? [])
                  return loc ? <span className="ml-1.5 text-[10px] text-slate-500">{loc}</span> : null
                })()}
              </div>
              {visit.severity && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${SEVERITY_CONFIG[visit.severity]?.badge}`}>
                  {SEVERITY_CONFIG[visit.severity]?.label}
                </span>
              )}
              {visit.improvement && (
                <span className="text-xs">{IMPROVEMENT_CONFIG[visit.improvement]?.icon} {IMPROVEMENT_CONFIG[visit.improvement]?.label}</span>
              )}
            </div>

            <div className="p-3 space-y-2">
              {/* Lesion types */}
              {visit.lesionTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visit.lesionTypes.map((t) => {
                    const lt = LESION_TYPES.find((x) => x.value === t)
                    return (
                      <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {lt ? `${lt.label} (${lt.labelEn})` : t}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Formal findings */}
              {visit.formalFindings && (
                <p className="text-[11px] text-slate-700 leading-relaxed">{visit.formalFindings}</p>
              )}

              {/* AI analysis */}
              {visit.aiAnalysis && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 space-y-1.5">
                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">AI 분석</p>
                  {visit.aiAnalysis.anatomical_location && (
                    <p className="text-[10px] text-slate-700">
                      <span className="font-semibold">위치:</span> {visit.aiAnalysis.anatomical_location}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-700 leading-snug">{visit.aiAnalysis.description}</p>
                  {visit.aiAnalysis.differential.length > 0 && (
                    <p className="text-[10px] text-slate-600">
                      <span className="font-semibold">감별진단:</span> {visit.aiAnalysis.differential.join(', ')}
                    </p>
                  )}
                  {visit.aiAnalysis.recommended_tests.length > 0 && (
                    <p className="text-[10px] text-slate-600">
                      <span className="font-semibold">추천 검사:</span> {visit.aiAnalysis.recommended_tests.join(', ')}
                    </p>
                  )}
                  {visit.aiAnalysis.immediate_action && (
                    <p className="text-[10px] text-rose-700 font-semibold">{visit.aiAnalysis.immediate_action}</p>
                  )}
                </div>
              )}

              {/* Thumbnail images */}
              {groupImgs.length > 0 && (
                <div className="flex gap-1.5">
                  {groupImgs.slice(0, 4).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt=""
                      className="h-16 w-16 rounded object-cover border border-slate-200"
                    />
                  ))}
                  {groupImgs.length > 4 && (
                    <div className="h-16 w-16 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-semibold">
                      +{groupImgs.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Notes */}
      {notes && (
        <div className="mb-3 rounded-lg border border-slate-200 p-3">
          <SectionHeader title="추가 소견" sub="Notes" />
          <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 border-t border-slate-200 pt-2.5 text-center">
        <p className="text-[9px] text-slate-400">
          본 보고서는 수의사의 임상 판단 하에 최종 진단하여야 합니다.
        </p>
      </div>
    </div>
  )
}

export default function DermReportDialog(props: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)

  const chartDetail = props.chartDetail
  const filename = `derm_${chartDetail.patient?.name ?? 'report'}_${chartDetail.chart_date}`

  const handleExportPng = async () => {
    if (!printRef.current) return
    setExporting('png')
    try {
      const canvas = await captureElement(printRef.current)
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally { setExporting(null) }
  }

  const handleExportPdf = async () => {
    if (!printRef.current) return
    setExporting('pdf')
    try {
      const canvas = await captureElement(printRef.current)
      const { jsPDF } = await import('jspdf')
      const imgW = canvas.width
      const imgH = canvas.height
      const margin = 10
      const pageW = 210
      const pageH = 297
      const contentW = pageW - margin * 2
      const contentH = (imgH * contentW) / imgW
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageContentH = pageH - margin * 2
      let yOffset = 0
      while (yOffset < contentH) {
        if (yOffset > 0) pdf.addPage()
        const srcY = (yOffset / contentH) * imgH
        const srcH = Math.min((pageContentH / contentH) * imgH, imgH - srcY)
        const renderH = (srcH / imgH) * contentH
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgW
        pageCanvas.height = srcH
        pageCanvas.getContext('2d')!.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH)
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentW, renderH)
        yOffset += pageContentH
      }
      pdf.save(`${filename}.pdf`)
    } finally { setExporting(null) }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <FileText className="h-4 w-4" />
          보고서
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b bg-slate-50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-emerald-600" />
            피부과 진료 보고서
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div ref={printRef} className="bg-white rounded-lg shadow-sm p-6 mx-auto" style={{ maxWidth: 680 }}>
            <ReportBody {...props} />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t bg-slate-50">
          <Button variant="outline" size="sm" onClick={handleExportPng} disabled={exporting !== null} className="gap-1.5 text-xs">
            {exporting === 'png' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting !== null} className="gap-1.5 text-xs">
            {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

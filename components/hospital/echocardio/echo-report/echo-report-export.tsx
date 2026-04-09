'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import type { EchoChartDetail, EchoResultMap, EchoSection } from '@/types/echocardio/echocardio-type'
import EchoReportTxtExport from './echo-report-txt-export'

interface EchoReportExportProps {
  reportRef: React.RefObject<HTMLDivElement | null>
  patientName: string
  chartDetail: EchoChartDetail
  resultMap: EchoResultMap
  computedResults: Record<string, { result: string; comment: string }>
  testDefinitions: any
  sortedSections: EchoSection[]
  reportData: any
}

export default function EchoReportExport({
  reportRef,
  patientName,
  chartDetail,
  resultMap: _resultMap,
  computedResults: _computedResults,
  testDefinitions: _testDefinitions,
  sortedSections,
  reportData,
}: EchoReportExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExportPng() {
    if (!reportRef.current) return
    setIsExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `${patientName}_심초차트.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPdf() {
    if (!reportRef.current) return
    setIsExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgRatio = canvas.height / canvas.width
      const imgWidth = pageWidth - 20
      const imgHeight = imgWidth * imgRatio

      // 페이지 분할
      let yOffset = 0
      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, 10 - yOffset, imgWidth, imgHeight)
        yOffset += pageHeight - 20
      }

      pdf.save(`${patientName}_심초차트.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* 텍스트 내보내기 컴포넌트 */}
      <EchoReportTxtExport 
        patientName={patientName}
        chartDetail={chartDetail}
        sortedSections={sortedSections}
        reportData={reportData}
      />

      {/* 이미지/PDF 내보내기 버튼 */}
      <button
        onClick={handleExportPng}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        PNG
      </button>
      <button
        onClick={handleExportPdf}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        PDF
      </button>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import MsReport, { ReportImageSize } from './ms-report'
import MsShareButton from '../ms-share-button'

type Props = {
  msData: MsWithPatientWithWeight
  isSharedView?: boolean
  onExportText?: () => void
  onClose?: () => void
}

export default function MsReportContent({ msData, isSharedView = false, onExportText, onClose }: Props) {
  const [isExporting, setIsExporting] = useState(false)
  const [imageSize, setImageSize] = useState<ReportImageSize>('medium')
  const reportRef = useRef<HTMLDivElement>(null)

  const fileName = `${msData.patient?.name ?? '미지정환자'}-${msData.due_date ?? ''}-리포트`

  const captureCanvas = async () => {
    if (!reportRef.current) throw new Error('리포트 영역을 찾을 수 없습니다')
    return html2canvas(reportRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
    })
  }

  const handleExportPng = async () => {
    setIsExporting(true)
    toast.info('PNG 파일을 생성 중입니다. 잠시만 기다려주세요.')
    try {
      const canvas = await captureCanvas()
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${fileName}.png`
      link.click()
    } catch (error) {
      console.error(error)
      toast.error('PNG 내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExporting(true)
    toast.info('PDF 파일을 생성 중입니다. 잠시만 기다려주세요.')
    try {
      const canvas = await captureCanvas()
      const imgData = canvas.toDataURL('image/jpeg', 0.85)

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const canvasWidth = canvas.width
      const canvasHeight = canvas.height

      const imgWidth = pdfWidth
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth

      let yPosition = 0
      let remainingHeight = imgHeight

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -yPosition, imgWidth, imgHeight)
        remainingHeight -= pdfHeight
        yPosition += pdfHeight
        if (remainingHeight > 0) pdf.addPage()
      }

      pdf.save(`${fileName}.pdf`)
    } catch (error) {
      console.error(error)
      toast.error('PDF 내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col w-full h-full px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4 pr-10 sm:pr-12">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            {msData.patient ? msData.patient.name : '미지정 환자'} 모니터링 리포트
          </h2>

          <div className="hidden sm:flex items-center gap-1 rounded-md border p-0.5">
            {(['small', 'medium', 'large'] as ReportImageSize[]).map((size) => (
              <Button
                key={size}
                variant={imageSize === size ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setImageSize(size)}
              >
                {size === 'small' ? '작게' : size === 'medium' ? '중간' : '크게'}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center shrink-0">
          <div className="sm:hidden flex items-center gap-1 w-full mb-2">
            <span className="text-xs font-semibold mr-2 text-primary">사진 크기:</span>
            {(['small', 'medium', 'large'] as ReportImageSize[]).map((size) => (
              <Button
                key={size}
                variant={imageSize === size ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setImageSize(size)}
              >
                {size === 'small' ? '작게' : size === 'medium' ? '중간' : '크게'}
              </Button>
            ))}
          </div>

          {!isSharedView && (
            <MsShareButton
              sessionId={msData.session_id}
              title={`${msData.patient?.name ?? '미지정결과'} (${msData.patient?.breed ?? ''}) 모니터링`}
              hosId={msData.hos_id}
            />
          )}

          <Button variant="outline" size="sm" className="text-xs font-semibold gap-1" onClick={handleExportPng} disabled={isExporting}>
            PNG {isExporting && <Spinner />}
          </Button>
          <Button variant="outline" size="sm" className="text-xs font-semibold gap-1" onClick={handleExportPdf} disabled={isExporting}>
            PDF {isExporting && <Spinner />}
          </Button>
          
          {!isSharedView && onExportText && (
            <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={onExportText} disabled={isExporting}>
              TEXT
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div ref={reportRef} className="bg-white p-4">
          <MsReport msData={msData} imageSize={imageSize} />
        </div>
      </div>
    </div>
  )
}

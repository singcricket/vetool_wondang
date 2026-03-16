'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { FileText } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { buildMsReportText } from './build-ms-report-text'
import MsReport from './ms-report'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'

type Props = {
  msData: MsWithPatientWithWeight
}

export default function MsReportContainer({ msData }: Props) {
  const [isParentsDialogOpen, setIsParentsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const { msContextData } = useMonitoringContextData()
  const { vetsListData } = msContextData

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

      // 한 페이지에 들어가지 않으면 여러 페이지로 분할
      const imgWidth = pdfWidth
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth

      let yPosition = 0
      let remainingHeight = imgHeight

      while (remainingHeight > 0) {
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          -yPosition,
          imgWidth,
          imgHeight,
        )
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

  const handleExportText = async () => {
    try {
      const text = buildMsReportText(msData, vetsListData)
      await navigator.clipboard.writeText(text)
      toast.success('리포트 텍스트를 클립보드에 복사했습니다.')
    } catch (error) {
      console.error(error)
      toast.error('클립보드 복사 중 오류가 발생했습니다.')
    }
  }

  return (
    <Dialog open={isParentsDialogOpen} onOpenChange={setIsParentsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FileText />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex w-[95vw] max-w-5xl max-h-[85vh] flex-col overflow-hidden">
        <DialogHeader className="gap-2">
          <DialogTitle>
            {msData.patient ? msData.patient.name : '미지정 환자'} 모니터링 리포트
          </DialogTitle>
          <DialogDescription className="flex gap-1">
            <Button
              variant="outline"
              className="text-xs font-semibold"
              size="sm"
              onClick={handleExportPng}
              disabled={isExporting}
            >
              PNG {isExporting && <Spinner />}
            </Button>
            <Button
              variant="outline"
              className="text-xs font-semibold"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
            >
              PDF {isExporting && <Spinner />}
            </Button>
            <Button
              variant="outline"
              className="text-xs font-semibold"
              size="sm"
              onClick={handleExportText}
              disabled={isExporting}
            >
              TEXT
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 pr-1">
          <div ref={reportRef} className="bg-white p-4">
            <MsReport msData={msData} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import DentalReportGeneral from './dental-report-general'
import DentalReportDetailed from './dental-report-detailed'
import DentalReportOwner from './dental-report-owner'

// import html2canvas from 'html2canvas'
// import { jsPDF } from 'jspdf'

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalReportDialog({ chartDetail, teeth, hosId }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [images, setImages] = useState<DentalImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const reportRef = useRef<HTMLDivElement>(null)
  
  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  const fetchImages = async () => {
    try {
      const data = await getDentalImages(chartDetail.id)
      setImages(data)
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      fetchImages()
    }
  }, [open, chartDetail.id])

  // Supabase Realtime 구독을 통해 이미지 마킹 실시간 업데이트
  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    
    const channel = supabase
      .channel('dental_images_report_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 
          schema: 'public',
          table: 'dental_images',
        },
        () => {
          fetchImages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open])

  const handleExportPDF = async () => {
    try {
      toast.loading('PDF를 생성하는 중입니다...', { id: 'pdf-export' })
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!reportRef.current) throw new Error('Ref not found')

      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgRatio = canvas.height / canvas.width
      const imgWidth = pageWidth - 20
      const imgHeight = imgWidth * imgRatio

      // 페이지 분할 로직 탑재
      let yOffset = 0
      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, 10 - yOffset, imgWidth, imgHeight)
        yOffset += pageHeight - 20
      }
      
      pdf.save(`dental_report_${chartDetail.patient?.name ?? 'patient'}_${chartDetail.chart_date}.pdf`)
      
      toast.success('PDF 생성 완료', { id: 'pdf-export' })
    } catch (e) {
      console.error(e)
      toast.error('PDF 내보내기 실패.', { id: 'pdf-export' })
    }
  }

  const handleExportPNG = async () => {
    try {
      toast.loading('이미지를 저장하는 중입니다...', { id: 'png-export' })
      const html2canvas = (await import('html2canvas')).default

      if (!reportRef.current) throw new Error('Ref not found')

      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false })
      const url = canvas.toDataURL('image/png')
      
      const link = document.createElement('a')
      link.download = `dental_report_${chartDetail.patient?.name ?? 'patient'}_${chartDetail.chart_date}.png`
      link.href = url
      link.click()
      
      toast.success('이미지 저장 완료', { id: 'png-export' })
    } catch (e) {
      console.error(e)
      toast.error('PNG 내보내기 실패.', { id: 'png-export' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="icon" 
          className="fixed bottom-24 right-8 h-12 w-12 rounded-full shadow-lg z-[60] hover:scale-105 transition-transform bg-teal-600 hover:bg-teal-700 text-white"
          title="치과 차트 리포트 보기"
        >
          <FileText className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white z-[110]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 border-b bg-slate-50 shrink-0 flex flex-row items-center justify-between pb-4 space-y-0">
          <div>
            <DialogTitle>치과 차트 리포트 ({chartDetail.patient?.name})</DialogTitle>
            <DialogDescription className="mt-1">
              {chartDetail.chart_date} 검진 결과 리포트
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-6">
             <Button variant="outline" size="sm" onClick={handleExportPNG}>
               <Download className="w-4 h-4 mr-2" /> PNG 저장
             </Button>
             <Button variant="default" size="sm" onClick={handleExportPDF} className="bg-teal-600 hover:bg-teal-700 text-white">
               <Download className="w-4 h-4 mr-2" /> PDF 저장
             </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-2 border-b bg-white shrink-0">
              <TabsList className="grid w-96 grid-cols-3">
                <TabsTrigger value="general">일반</TabsTrigger>
                <TabsTrigger value="detailed">상세</TabsTrigger>
                <TabsTrigger value="owner">보호자용</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 p-4" id="report-scroll-container">
              <div 
                ref={reportRef} 
                className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-sm border border-slate-200 min-h-[A4] text-slate-800"
              >
                {/* 
                  reportRef 하위에 있는 내용을 html2canvas로 캡처 
                */}
                <TabsContent value="general" className="m-0 border-0 outline-none p-0">
                  <DentalReportGeneral chartDetail={chartDetail} teeth={teeth} species={species} />
                </TabsContent>

                <TabsContent value="detailed" className="m-0 border-0 outline-none p-0">
                  <DentalReportDetailed chartDetail={chartDetail} teeth={teeth} images={images} species={species} />
                </TabsContent>

                <TabsContent value="owner" className="m-0 border-0 outline-none p-0">
                  <DentalReportOwner chartDetail={chartDetail} teeth={teeth} images={images} species={species} />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

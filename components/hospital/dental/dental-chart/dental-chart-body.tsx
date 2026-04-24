'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import { createClient } from '@/lib/supabase/client'
import DentalToothDialog from './dental-tooth-dialog'
import DentalChartDetailPanel from './dental-chart-detail-panel'
import DentalChartGeneralPanel from './dental-chart-general-panel'
import DentalImageUploadDialog from '../dental-image-uploader/dental-image-upload-dialog'
import DentalReportDialog from '../dental-report/dental-report-dialog'
import DentalChartTestPanel from './dental-chart-test-panel'
import { LayoutDashboard, Activity, SquareGanttChart, MonitorPlay, ImageIcon } from 'lucide-react'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import type { DentalImage } from '@/types/dental/dental-type'

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalChartBody({ chartDetail, teeth, hosId }: Props) {
  const [localChartDetail, setLocalChartDetail] = useState(chartDetail)
  const [localTeeth, setLocalTeeth] = useState(teeth)
  const [localImages, setLocalImages] = useState<DentalImage[]>([])
  const [selectedToothId, setSelectedToothId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Realtime 구독
  useEffect(() => {
    const supabase = createClient()
    
    // 1. 차트 기본 정보 구독 (dental_charts)
    const chartChannel = supabase
      .channel(`dental_chart_${chartDetail.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dental_charts',
          filter: `id=eq.${chartDetail.id}`
        },
        (payload) => {
          setLocalChartDetail(prev => ({ ...prev, ...(payload.new as any) }))
        }
      )
      .subscribe()

    // 2. 개별 치아 정보 구독 (dental_chart_teeth)
    const teethChannel = supabase
      .channel(`dental_teeth_${chartDetail.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dental_chart_teeth',
          filter: `chart_id=eq.${chartDetail.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedTooth = payload.new as DentalTooth
            setLocalTeeth(prev => {
              const index = prev.findIndex(t => t.id === updatedTooth.id)
              if (index > -1) {
                const next = [...prev]
                next[index] = { ...next[index], ...updatedTooth }
                return next
              }
              return [...prev, updatedTooth]
            })
          } else if (payload.eventType === 'DELETE') {
            setLocalTeeth(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // 3. 이미지 정보 구독 (dental_images)
    const imagesChannel = supabase
      .channel(`dental_images_${chartDetail.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dental_images',
          filter: `chart_id=eq.${chartDetail.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLocalImages(prev => [...prev, payload.new as DentalImage])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DentalImage
            setLocalImages(prev => prev.map(img => img.dental_image_id === updated.dental_image_id ? updated : img))
          } else if (payload.eventType === 'DELETE') {
            setLocalImages(prev => prev.filter(img => img.dental_image_id !== payload.old.dental_image_id))
          }
        }
      )
      .subscribe()

    // 초기 이미지 로드
    getDentalImages(chartDetail.id).then(setLocalImages).catch(console.error)

    return () => {
      supabase.removeChannel(chartChannel)
      supabase.removeChannel(teethChannel)
      supabase.removeChannel(imagesChannel)
    }
  }, [chartDetail.id])

  const species = localChartDetail.species ?? localChartDetail.patient?.species ?? 'canine'

  function handleToothClick(id: string) {
    setSelectedToothId(id)
    setDialogOpen(true)
  }

  const existingTooth = localTeeth.find((t) => String(t.tooth_id) === selectedToothId)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <Tabs defaultValue="detail" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-slate-100/50 p-0 h-12 shrink-0">
          <TabsTrigger 
            value="general"
            className="group relative rounded-none border-r data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none h-full transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 transition-colors group-data-[state=active]:text-indigo-600 text-slate-400" />
              <span className="font-semibold text-sm">일반 차트</span>
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-indigo-600 transition-transform duration-200 group-data-[state=active]:scale-x-100" />
          </TabsTrigger>
          <TabsTrigger 
            value="detail" 
            className="group relative rounded-none data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none h-full transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <SquareGanttChart className="w-4 h-4 transition-colors group-data-[state=active]:text-indigo-600 text-slate-400" />
              <span className="font-semibold text-sm">디테일 차트</span>
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-indigo-600 transition-transform duration-200 group-data-[state=active]:scale-x-100" />
          </TabsTrigger>
          <TabsTrigger 
            value="test" 
            className="group relative rounded-none data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none h-full transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 transition-colors group-data-[state=active]:text-indigo-600 text-slate-400" />
              <span className="font-semibold text-sm">차트 리뷰</span>
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-indigo-600 transition-transform duration-200 group-data-[state=active]:scale-x-100" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="m-0 flex-1 overflow-hidden focus-visible:ring-0">
          <DentalChartGeneralPanel
            chartDetail={localChartDetail}
            hosId={hosId}
            images={localImages}
            onImagesChange={setLocalImages}
          />
        </TabsContent>

        <TabsContent value="detail" className="m-0 flex-1 overflow-hidden focus-visible:ring-0">
          <DentalChartDetailPanel
            species={species}
            selectedToothId={selectedToothId}
            onToothClick={handleToothClick}
            teeth={localTeeth}
            images={localImages}
          />
        </TabsContent>

        <TabsContent value="test" className="m-0 flex-1 overflow-hidden focus-visible:ring-0">
          <DentalChartTestPanel
            chartDetail={localChartDetail}
            teeth={localTeeth}
            images={localImages}
          />
        </TabsContent>
      </Tabs>

      {/* ── 치아 상세 Dialog ── */}
      {selectedToothId && (
        <DentalToothDialog
          key={selectedToothId}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          toothId={selectedToothId}
          chartDetail={localChartDetail}
          hosId={hosId}
          existing={existingTooth}
        />
      )}

      {/* ── 다중 이미지 업로더 다이얼로그 (우측 하단 플로팅 버튼) ── */}
      <DentalImageUploadDialog
        chartDetail={localChartDetail}
        teeth={localTeeth}
        hosId={hosId}
      />

      {/* ── 리포트 수출 및 열람용 다이얼로그 (우측 하단 두번째 버튼) ── */}
      <DentalReportDialog
        chartDetail={localChartDetail}
        teeth={localTeeth}
        hosId={hosId}
      />
    </div>
  )
}

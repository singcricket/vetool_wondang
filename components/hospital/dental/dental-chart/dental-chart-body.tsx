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
import DentalChartRadioPanel from './dental-chart-radio-panel'
import { LayoutDashboard, Activity, SquareGanttChart, MonitorPlay, ImageIcon, X, ScanLine } from 'lucide-react'
import { getDentalImages } from '@/lib/actions/dental/get-dental-images'
import type { DentalImage } from '@/types/dental/dental-type'
import { Button } from '@/components/ui/button'

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalChartBody({ chartDetail, teeth, hosId }: Props) {
  const [localChartDetail, setLocalChartDetail] = useState(chartDetail)
  const [localTeeth, setLocalTeeth] = useState(teeth)
  const [localImages, setLocalImages] = useState<DentalImage[]>([])
  const [selectedToothIds, setSelectedToothIds] = useState<string[]>([])
  const [existingTooth, setExistingTooth] = useState<DentalTooth | undefined>(undefined)
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

  function handleToothClick(id: string, e?: React.MouseEvent) {
    const isAlreadySelected = selectedToothIds.includes(id)

    if (e?.ctrlKey || e?.metaKey) {
      setSelectedToothIds(prev => 
        prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
      )
    } else if (isAlreadySelected && selectedToothIds.length > 1) {
      // 이미 선택된 상태에서 클릭 시 (다중 선택 상태 유지하며 다이얼로그 오픈)
      setExistingTooth(undefined)
      setDialogOpen(true)
    } else {
      setSelectedToothIds([id])
      setExistingTooth(localTeeth.find(t => String(t.tooth_id) === id))
      setDialogOpen(true)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <Tabs defaultValue="detail" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-slate-100/50 p-0 h-12 shrink-0">
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
          <TabsTrigger 
            value="radio" 
            className="group relative rounded-none data-[state=active]:bg-slate-950 data-[state=active]:text-yellow-400 data-[state=active]:shadow-none h-full transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 transition-colors group-data-[state=active]:text-yellow-400 text-slate-400" />
              <span className="font-semibold text-sm">방사선리뷰</span>
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-yellow-400 transition-transform duration-200 group-data-[state=active]:scale-x-100" />
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
            selectedToothId={selectedToothIds.length === 1 ? selectedToothIds[0] : null}
            selectedToothIds={selectedToothIds}
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

        <TabsContent value="radio" className="m-0 flex-1 overflow-hidden focus-visible:ring-0">
          <DentalChartRadioPanel
            images={localImages.filter(img => img.is_radio)}
            chartDetail={localChartDetail}
            teeth={localTeeth}
          />
        </TabsContent>
      </Tabs>

      {/* ── 다중 선택 시 일괄 편집 버튼 ── */}
      {selectedToothIds.length > 1 && !dialogOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <Button
            onClick={() => {
              setExistingTooth(undefined)
              setDialogOpen(true)
            }}
            size="lg"
            className="rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 gap-2 border-4 border-white"
          >
            <SquareGanttChart className="w-5 h-5" />
            <span className="font-bold text-lg">{selectedToothIds.length}개 치아 일괄 편집</span>
          </Button>

          <Button
            onClick={() => setSelectedToothIds([])}
            variant="outline"
            size="icon"
            className="rounded-full shadow-xl bg-white hover:bg-slate-50 border-4 border-white h-14 w-14 shrink-0 transition-all hover:scale-110 active:scale-95"
            title="선택 해제"
          >
            <X className="w-6 h-6 text-slate-500" />
          </Button>
        </div>
      )}

      {/* ── 치아 상세 Dialog ── */}
      {selectedToothIds.length > 0 && (
        <DentalToothDialog
          key={selectedToothIds.join(',')}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          toothIds={selectedToothIds}
          chartDetail={localChartDetail}
          hosId={hosId}
          existing={existingTooth}
          teeth={localTeeth}
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

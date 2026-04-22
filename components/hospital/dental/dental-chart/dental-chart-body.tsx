'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalToothDialog from './dental-tooth-dialog'
import DentalChartDetailPanel from './dental-chart-detail-panel'
import DentalChartGeneralPanel from './dental-chart-general-panel'
import DentalImageUploadDialog from '../dental-image-uploader/dental-image-upload-dialog'

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalChartBody({ chartDetail, teeth, hosId }: Props) {
  const [selectedToothId, setSelectedToothId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  function handleToothClick(id: string) {
    setSelectedToothId(id)
    setDialogOpen(true)
  }

  const existingTooth = teeth.find((t) => String(t.tooth_id) === selectedToothId)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <Tabs defaultValue="detail" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-slate-50 p-0 h-11 shrink-0">
          <TabsTrigger 
            value="general"
            className="rounded-none border-r data-[state=active]:bg-white data-[state=active]:font-bold h-full"
          >
            일반 차트
          </TabsTrigger>
          <TabsTrigger 
            value="detail" 
            className="rounded-none data-[state=active]:bg-white data-[state=active]:font-bold h-full"
          >
            디테일 차트
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="m-0 flex-1 overflow-hidden focus-visible:ring-0">
          <DentalChartGeneralPanel
            chartDetail={chartDetail}
            hosId={hosId}
          />
        </TabsContent>

        <TabsContent value="detail" className="m-0 flex-1 overflow-hidden focus-visible:ring-0">
          <DentalChartDetailPanel
            species={species}
            selectedToothId={selectedToothId}
            onToothClick={handleToothClick}
            teeth={teeth}
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
          chartDetail={chartDetail}
          hosId={hosId}
          existing={existingTooth}
        />
      )}

      {/* ── 다중 이미지 업로더 다이얼로그 (우측 하단 플로팅 버튼) ── */}
      <DentalImageUploadDialog
        chartDetail={chartDetail}
        teeth={teeth}
        hosId={hosId}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/utils'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'
import DentalChartSvgPanel from './dental-chart-svg-panel'
import DentalToothDialog from './dental-tooth-dialog'
import DentalOralEvalTab from './dental-chart-tabs/dental-oral-eval-tab'
import DentalProcedureTab from './dental-chart-tabs/dental-procedure-tab'
import DentalTreatmentTab from './dental-chart-tabs/dental-treatment-tab'
import DentalNoteTab from './dental-chart-tabs/dental-note-tab'

type Tab = 'oral' | 'procedure' | 'treatment' | 'note'

const TABS: { key: Tab; label: string }[] = [
  { key: 'oral', label: '구강 평가' },
  { key: 'procedure', label: '처치 내역' },
  { key: 'treatment', label: '치료 계획' },
  { key: 'note', label: '메모' },
]

type Props = {
  chartDetail: DentalChartDetail
  teeth: DentalTooth[]
  hosId: string
}

export default function DentalChartBody({ chartDetail, teeth, hosId }: Props) {
  const [selectedToothId, setSelectedToothId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('oral')

  const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

  function handleToothClick(id: string) {
    setSelectedToothId(id)
    setDialogOpen(true)
  }

  const existingTooth = teeth.find((t) => String(t.tooth_id) === selectedToothId)

  return (
    // 좌우 2패널 레이아웃
    <div className="flex flex-1 overflow-hidden">

      {/* ── 좌측: SVG 치아 차트 (고정 너비 840px) ── */}
      <div className="hidden w-[840px] shrink-0 border-r xl:flex xl:flex-col">
        <div className="shrink-0 border-b bg-slate-50 px-3 py-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">
            치아 차트 — 클릭하면 상세 입력
          </p>
        </div>
        <DentalChartSvgPanel
          species={species}
          selectedToothId={selectedToothId}
          onToothClick={handleToothClick}
          teeth={teeth}
        />
      </div>

      {/* ── 우측: 탭 폼 ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* 모바일/태블릿용 SVG (xl 미만에서 표시) */}
        <div className="xl:hidden shrink-0 border-b">
          <div className="bg-slate-50 px-3 py-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground">
              치아 차트 — 치아를 클릭하세요
            </p>
          </div>
          <div className="h-[200px] overflow-auto">
            <DentalChartSvgPanel
              species={species}
              selectedToothId={selectedToothId}
              onToothClick={handleToothClick}
              teeth={teeth}
            />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex shrink-0 items-center overflow-x-auto border-b bg-background">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'shrink-0 px-4 py-2.5 text-sm transition-colors',
                activeTab === t.key
                  ? 'border-b-2 border-black font-bold text-black'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'oral' && (
            <DentalOralEvalTab chartDetail={chartDetail} hosId={hosId} />
          )}
          {activeTab === 'procedure' && (
            <DentalProcedureTab chartDetail={chartDetail} hosId={hosId} />
          )}
          {activeTab === 'treatment' && (
            <DentalTreatmentTab chartDetail={chartDetail} hosId={hosId} />
          )}
          {activeTab === 'note' && (
            <DentalNoteTab chartDetail={chartDetail} hosId={hosId} />
          )}
        </div>
      </div>

      {/* ── 치아 상세 Dialog ── */}
      {selectedToothId && (
        <DentalToothDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          toothId={selectedToothId}
          chartId={chartDetail.id}
          hosId={hosId}
          existing={existingTooth}
        />
      )}
    </div>
  )
}

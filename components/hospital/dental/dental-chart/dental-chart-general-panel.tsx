'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/utils'
import type { DentalChartDetail } from '@/types/dental/dental-type'
import DentalOralEvalTab from './dental-chart-tabs/dental-oral-eval-tab'
import DentalProcedureTab from './dental-chart-tabs/dental-procedure-tab'
import DentalTreatmentTab from './dental-chart-tabs/dental-treatment-tab'
import DentalNoteTab from './dental-chart-tabs/dental-note-tab'

type Tab = 'oral' | 'procedure' | 'treatment' | 'note'

const TABS: { key: Tab; label: string }[] = [
   { key: 'note', label: '일반' },
  { key: 'oral', label: '구강 평가' },
  { key: 'procedure', label: '처치 내역' },
  { key: 'treatment', label: '치료 계획' },
 
]

interface Props {
  chartDetail: DentalChartDetail
  hosId: string
}

export default function DentalChartGeneralPanel({ chartDetail, hosId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('oral')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 탭 네비게이션 */}
      <div className="flex shrink-0 items-center overflow-x-auto border-b bg-background">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'shrink-0 px-6 py-3 text-sm transition-colors',
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
      <div className="flex-1 overflow-auto bg-white">
         {activeTab === 'note' && (
          <DentalNoteTab chartDetail={chartDetail} hosId={hosId} />
        )}
        {activeTab === 'oral' && (
          <DentalOralEvalTab chartDetail={chartDetail} hosId={hosId} />
        )}
        {activeTab === 'procedure' && (
          <DentalProcedureTab chartDetail={chartDetail} hosId={hosId} />
        )}
        {activeTab === 'treatment' && (
          <DentalTreatmentTab chartDetail={chartDetail} hosId={hosId} />
        )}
       
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { UltrasoundChartDetail } from '@/types/hospital/ultrasound-type'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  chartDetail: UltrasoundChartDetail
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
}

export default function UltrasoundChartLayout({ chartDetail, children, onSave, isSaving }: Props) {
  const router = useRouter()

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      {/* Header - Fixed at top */}
      <header className="sticky top-0 flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              복부 초음파 차트
            </h1>
            <p className="text-xs text-slate-500">
              {chartDetail.patient?.name} ({chartDetail.patient?.breed}) • {chartDetail.chart_date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 gap-2 h-9"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            저장
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}

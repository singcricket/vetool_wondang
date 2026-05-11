'use client'

import React from 'react'
import type { OphthalmicChartDetail } from '@/types/hospital/ophthalmic-type'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OphthalmicReportDialog from './ophthalmic-report-dialog'
import OphthalmicTextReportDialog from './ophthalmic-text-report-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ophthalmicReference } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import { cn } from '@/lib/utils/utils'

interface Props {
  chartDetail: OphthalmicChartDetail
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
  onDelete?: () => void
  isDeleting?: boolean
  activeDomain: string
  setActiveDomain: (id: string) => void
  guestMode?: boolean
  currentResults: Record<string, string | string[]>
  onResetAll?: () => void
  engineOutput: any
  treatmentData?: Record<string, any> | null
}

export default function OphthalmicChartLayout({
  chartDetail,
  children,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
  activeDomain,
  setActiveDomain,
  guestMode = false,
  currentResults,
  onResetAll,
  engineOutput,
  treatmentData,
}: Props) {
  const router = useRouter()
  const params = useParams()
  const hos_id = params.hos_id as string

  const getDomainColor = (name: string) => {
    if (name.includes('OD')) return 'bg-blue-100 text-blue-700 ring-blue-300'
    if (name.includes('OS')) return 'bg-orange-100 text-orange-700 ring-orange-300'
    if (name.includes('OU')) return 'bg-purple-100 text-purple-700 ring-purple-300'
    return 'bg-slate-100 text-slate-700 ring-slate-300'
  }

  const getActiveDomainColor = (name: string) => {
    if (name.includes('OD')) return 'bg-blue-600 text-white shadow-md ring-blue-600'
    if (name.includes('OS')) return 'bg-orange-600 text-white shadow-md ring-orange-600'
    if (name.includes('OU')) return 'bg-purple-600 text-white shadow-md ring-purple-600'
    return 'bg-slate-700 text-white shadow-md ring-slate-700'
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/hospital/${hos_id}/patients/${chartDetail.patient_id}` as any)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
              안과 전문 검사 (Ophthalmic Exam)
            </h1>
            {guestMode ? (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded-md">
                ⚠ 미등록 모드 — 저장 불가
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">
                  {chartDetail.patient?.name} ({chartDetail.patient?.species === 'cat' ? '고양이' : '개'})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {chartDetail.patient_id.slice(0, 8)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>차트 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 이 차트를 삭제하시겠습니까? 삭제된 차트는 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} disabled={isDeleting} className="bg-rose-500 hover:bg-rose-600">
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <OphthalmicTextReportDialog
            chartDetail={chartDetail}
            results={currentResults}
            engineOutput={engineOutput}
            treatmentData={treatmentData}
          />

          <OphthalmicReportDialog 
            chartDetail={chartDetail}
            results={currentResults}
            engineOutput={engineOutput}
          />

          <Button 
            onClick={onSave} 
            disabled={isSaving || guestMode}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed min-w-[100px]"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </header>

      {/* Domain Tabs */}
      <div className="flex shrink-0 overflow-x-auto bg-white border-b px-4 no-scrollbar shadow-sm z-10">
        <div className="flex space-x-2 py-2">
          {ophthalmicReference.domainSections.map((section) => (
            <button
              key={section.domain}
              onClick={() => setActiveDomain(section.domain)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ring-1 ring-inset",
                activeDomain === section.domain 
                  ? getActiveDomainColor(section.domainNameKo)
                  : cn("hover:opacity-80", getDomainColor(section.domainNameKo))
              )}
            >
              {section.domainNameKo}
            </button>
          ))}
          <button
            onClick={() => setActiveDomain('treatment')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ring-1 ring-inset",
              activeDomain === 'treatment'
                ? "bg-indigo-600 text-white shadow-md ring-indigo-600"
                : "bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-indigo-100"
            )}
          >
            치료 계획 / 처방
          </button>
        </div>

        {onResetAll && (
          <div className="flex items-center ml-auto pl-4 border-l my-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 gap-1 h-8"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">전체 초기화</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>모든 항목 초기화</AlertDialogTitle>
                  <AlertDialogDescription>
                    작성 중인 모든 검사 결과가 초기 상태(정상)로 돌아갑니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onResetAll}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    초기화 실행
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}

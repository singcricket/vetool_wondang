'use client'

import React from 'react'
import type { NeuroChartDetail } from '@/types/hospital/neuro-type'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NeuroReportDialog from './neuro-report-dialog'
import NeuroTextReportDialog from './neuro-text-report-dialog'
import NeuroTestSearch from './neuro-test-search'
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
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'

interface Props {
  chartDetail: NeuroChartDetail
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
  onDelete?: () => void
  isDeleting?: boolean
  activeDomain: string
  setActiveDomain: (id: string) => void
  guestMode?: boolean
  currentResults: Record<string, string | string[]>
  currentLocalisations: any
  onResetAll?: () => void
  onResultsChange?: (results: Record<string, string | string[]>) => void
}

export default function NeuroChartLayout({ 
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
  currentLocalisations,
  onResetAll,
  onResultsChange,
}: Props) {
  const router = useRouter()
  const params = useParams()
  const hos_id = params.hos_id as string

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      {/* Header - Fixed at top */}
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6 shrink-0 shadow-sm">
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
              신경학적 검사 (Neuro Exam)
            </h1>
            {guestMode ? (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded-md">
                ⚠ 미등록 모드 — 저장 불가
              </span>
            ) : (
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">
                {chartDetail.patient?.name} ({chartDetail.patient?.species === 'cat' ? '고양이' : '개'})
              </span>
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
          
          <NeuroTextReportDialog 
            chartDetail={chartDetail}
            results={currentResults}
            localisations={currentLocalisations}
          />

          <NeuroReportDialog 
            chartDetail={chartDetail}
            results={currentResults}
            localisations={currentLocalisations}
          />

          <Button 
            onClick={onSave} 
            disabled={isSaving || guestMode}
            title={guestMode ? '미등록 모드에서는 저장할 수 없습니다' : undefined}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {guestMode ? '저장 불가 (미등록)' : isSaving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </header>

      {/* Domain Tabs */}
      <div className="flex shrink-0 overflow-x-auto bg-white border-b px-4 no-scrollbar shadow-sm z-10">
        <div className="flex space-x-1 py-2">
          {neuroReference.domainSections.map((section) => (
            <button
              key={section.domain}
              onClick={() => setActiveDomain(section.domain)}
              className={`
                px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap
                ${activeDomain === section.domain 
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              {section.domainNameKo}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto pr-2">
          <NeuroTestSearch 
            onSelect={(test) => {
              // 1. 결과 업데이트 (게이트 열기 및 의존성 충족)
              if (onResultsChange) {
                const newResults = { ...currentResults }
                const domain = neuroReference.domainSections.find(d => d.domain === test.domain)
                
                if (domain) {
                  // 해당 도메인 게이트 열기
                  newResults[domain.statusGate.testID] = domain.statusGate.abnormalValue
                  
                  // 의존성(dependsOn) 처리
                  const processDeps = (t: any) => {
                    if (!t.dependsOn) return
                    const deps = Array.isArray(t.dependsOn) ? t.dependsOn : [t.dependsOn]
                    deps.forEach((dep: any) => {
                      const currentVal = newResults[dep.testID]
                      if (!dep.triggerValues.includes(currentVal)) {
                        newResults[dep.testID] = dep.triggerValues[0]
                      }
                      // 부모 의존성도 재귀적으로 처리
                      const parentTest = domain.tests.find(pt => pt.testID === dep.testID)
                      if (parentTest) processDeps(parentTest)
                    })
                  }
                  processDeps(test)
                }
                onResultsChange(newResults)
              }

              // 2. 탭 전환 및 스크롤
              setActiveDomain(test.domain)
              setTimeout(() => {
                const element = document.getElementById(`test-${test.testID}`)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  element.classList.add('ring-4', 'ring-indigo-500/30', 'border-indigo-500', 'shadow-lg')
                  setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-indigo-500/30', 'border-indigo-500', 'shadow-lg')
                  }, 3000)
                }
              }, 300) // 렌더링 시간을 위해 지연 시간 소폭 증가
            }}
          />

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
                  <span className="text-xs">전체 초기화</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>모든 항목 초기화</AlertDialogTitle>
                  <AlertDialogDescription>
                    작성 중인 모든 검사 결과가 삭제되고 초기 상태(정상)로 돌아갑니다. 이 작업은 되돌릴 수 없습니다.
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
    </div>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}

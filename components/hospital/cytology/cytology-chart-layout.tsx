'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Microscope, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import CytologyImageUploadDialog from './cytology-image-uploader/cytology-image-upload-dialog'
import type { CytologyChartDetail } from '@/types/hospital/cytology-type'
import type { CytologySampleType, CytologyMode } from '@/constants/hospital/cytology/cytology-types'

const SAMPLE_LABELS: Record<CytologySampleType, string> = {
  otic: '귀도말',
  skin_impression: '피부인상도말',
  skin_exudate: '피부삼출물',
  fecal: '분변염색',
  blood_smear: '혈액도말',
  fna_skin: 'FNA-피부',
  fna_lymph: 'FNA-림프절',
  fna_organ: 'FNA-장기',
  effusion: '체강액',
  synovial: '관절액',
  csf: '뇌척수액',
  bal: 'BAL',
}

const ALL_SAMPLE_TYPES: CytologySampleType[] = [
  'otic', 'skin_impression', 'skin_exudate', 'fecal', 'blood_smear',
  'fna_skin', 'fna_lymph', 'fna_organ', 'effusion', 'synovial', 'csf', 'bal',
]

interface Props {
  chartDetail: CytologyChartDetail
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
  onDelete?: () => void
  isDeleting?: boolean
  guestMode?: boolean
  activeSamples: CytologySampleType[]
  currentSample: CytologySampleType
  currentMode: CytologyMode
  onSampleClick: (t: CytologySampleType) => void   // add if not active, switch if active
  onRemoveSample: (t: CytologySampleType) => void
  onModeChange: (m: CytologyMode) => void
}

export default function CytologyChartLayout({
  chartDetail,
  children,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
  guestMode = false,
  activeSamples,
  currentSample,
  currentMode,
  onSampleClick,
  onRemoveSample,
  onModeChange,
}: Props) {
  const router = useRouter()
  const params = useParams()
  const hos_id = params.hos_id as string

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(
                `/hospital/${hos_id}/patients/${chartDetail.patient_id}` as Parameters<typeof router.push>[0],
              )
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <Microscope className="h-5 w-5 text-violet-600 hidden sm:block" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
              세포학 (Cytology)
            </h1>
            {guestMode ? (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1 rounded-md">
                ⚠ 미등록 모드 — 저장 불가
              </span>
            ) : (
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">
                {chartDetail.patient?.name}
                {chartDetail.patient?.species
                  ? ` (${chartDetail.patient.species === 'cat' ? '고양이' : '개'})`
                  : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                >
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
                  <AlertDialogAction
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            onClick={onSave}
            disabled={isSaving || guestMode}
            title={guestMode ? '미등록 모드에서는 저장할 수 없습니다' : undefined}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {guestMode ? '저장 불가 (미등록)' : isSaving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </header>

      {/* Sample Type Tabs */}
      <div className="flex shrink-0 overflow-x-auto bg-white border-b px-2 no-scrollbar shadow-sm z-10">
        <div className="flex items-center gap-0.5 py-2 min-w-max">
          {ALL_SAMPLE_TYPES.map((type) => {
            const isActive = activeSamples.includes(type)
            const isCurrent = currentSample === type

            if (isActive) {
              return (
                <div
                  key={type}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSampleClick(type)}
                    className="whitespace-nowrap"
                  >
                    {SAMPLE_LABELS[type]}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSample(type)
                    }}
                    disabled={activeSamples.length === 1}
                    className={`rounded-full p-0.5 transition-colors disabled:opacity-30 ${
                      isCurrent
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-violet-300 text-violet-600'
                    }`}
                    title="이 검체 제거"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            }

            return (
              <button
                key={type}
                type="button"
                onClick={() => onSampleClick(type)}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all whitespace-nowrap"
                title={`${SAMPLE_LABELS[type]} 추가`}
              >
                <Plus className="h-3 w-3 opacity-60" />
                {SAMPLE_LABELS[type]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex shrink-0 overflow-x-auto bg-white border-b px-4 no-scrollbar z-10">
        <div className="flex space-x-1 py-2">
          <button
            onClick={() => onModeChange('specialist')}
            className={`
              px-4 py-1.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap
              ${
                currentMode === 'specialist'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
              }
            `}
          >
            전문가 모드
          </button>
          <button
            onClick={() => onModeChange('ai')}
            className={`
              px-4 py-1.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap
              ${
                currentMode === 'ai'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
              }
            `}
          >
            AI 보조 모드
          </button>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Image Hub Button */}
      {chartDetail && (
        <CytologyImageUploadDialog
          chartId={chartDetail.id}
          hosId={params.hos_id as string}
        />
      )}
    </div>
  )
}

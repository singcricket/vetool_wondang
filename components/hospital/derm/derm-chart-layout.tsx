'use client'

import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { DermChartDetail } from '@/types/hospital/derm-type'

interface Props {
  chartDetail: DermChartDetail
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

export default function DermChartLayout({
  chartDetail,
  children,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
}: Props) {
  const router = useRouter()
  const params = useParams()
  const hosId = params.hos_id as string

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            onClick={() => router.push(`/hospital/${hosId}/patients/${chartDetail.patient_id}` as any)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Stethoscope className="h-5 w-5 text-emerald-600 hidden sm:block" />
          <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
            피부과 (Dermatology)
          </h1>

          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">
            {chartDetail.patient?.name}
            {chartDetail.patient?.species
              ? ` (${chartDetail.patient.species === 'cat' ? '고양이' : '개'})`
              : ''}
          </span>

          <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${
            chartDetail.visit_type === 'followup'
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {chartDetail.visit_type === 'followup' ? '재진' : '초진'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>차트 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 피부과 차트를 삭제하시겠습니까? 삭제된 차트는 복구할 수 없습니다.
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
            disabled={isSaving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

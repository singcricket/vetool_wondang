'use client'

import React from 'react'
import { UltrasoundChartDetail } from '@/types/hospital/ultrasound-type'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
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

interface Props {
  chartDetail: UltrasoundChartDetail
  children: React.ReactNode
  onSave?: () => void
  isSaving?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

export default function UltrasoundChartLayout({ 
  chartDetail, 
  children, 
  onSave, 
  isSaving,
  onDelete,
  isDeleting 
}: Props) {
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
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2 h-9"
                  disabled={isDeleting || isSaving}
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>차트를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 해당 차트와 관련된 모든 데이터가 영구적으로 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 gap-2 h-9"
            onClick={onSave}
            disabled={isSaving || isDeleting}
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

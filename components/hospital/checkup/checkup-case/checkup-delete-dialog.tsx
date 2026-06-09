'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteCheckupRecord } from '@/lib/actions/checkup/checkup-actions'

interface Props {
  checkupId: string
  hosId: string
  patientName: string
  checkupDate: string
}

export default function CheckupDeleteDialog({ checkupId, hosId, patientName, checkupDate }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [inputName, setInputName] = useState('')
  const [isPending, startTransition] = useTransition()

  const confirmed = inputName.trim() === patientName.trim()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCheckupRecord(checkupId, hosId)
        toast.success('건강검진 기록이 삭제되었습니다.')
        setOpen(false)
        router.push(`/hospital/${hosId}/checkup`)
        router.refresh()
      } catch {
        toast.error('삭제에 실패했습니다. 다시 시도해주세요.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-500 hover:border-red-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={13} />
        삭제
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); setInputName('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">건강검진 기록 삭제</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">다음 데이터가 영구적으로 삭제됩니다.</p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                <li>문진·신체검사·임상병리·영상검사·평가계획 입력 데이터 전체</li>
                <li>업로드된 이미지 파일 전체</li>
                <li>AI 분석 결과</li>
              </ul>
              <p className="mt-2 font-semibold">이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">대상 환자: </span>
              <span className="font-bold text-slate-900">{patientName}</span>
              <span className="ml-2 text-slate-400 text-xs">({checkupDate})</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                삭제를 확인하려면 환자명 <span className="font-bold text-slate-900">"{patientName}"</span>을 입력하세요.
              </p>
              <Input
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder={`환자명 입력`}
                className="text-sm"
                disabled={isPending}
                onKeyDown={(e) => { if (e.key === 'Enter' && confirmed) handleDelete() }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setOpen(false); setInputName('') }}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!confirmed || isPending}
              onClick={handleDelete}
            >
              {isPending ? '삭제 중...' : '영구 삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

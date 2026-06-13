'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StethoscopeIcon, LoaderCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { updateCheckupVet } from '@/lib/actions/checkup/checkup-actions'
import { useCheckupContext } from '@/providers/checkup-context-provider'

interface Props {
  checkupId: string
  vetId: string | null
  vetName: string | null
}

export default function CheckupVetSelector({ checkupId, vetId, vetName }: Props) {
  const { refresh } = useRouter()
  const { vetsList } = useCheckupContext()

  const [open, setOpen] = useState(false)
  const [selectedVetId, setSelectedVetId] = useState(vetId ?? 'none')
  const [submitting, setSubmitting] = useState(false)

  const handleSave = async () => {
    setSubmitting(true)
    try {
      await updateCheckupVet(checkupId, selectedVetId === 'none' ? null : selectedVetId)
      toast.success('담당의를 변경했습니다.')
      setOpen(false)
      refresh()
    } catch {
      toast.error('담당의 변경에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
        >
          <StethoscopeIcon size={12} />
          <span className="text-slate-400">담당의</span>
          <span className="font-medium">{vetName ?? '미지정'}</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>담당의 지정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          <Select value={selectedVetId} onValueChange={setSelectedVetId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="선택 안 함" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">선택 안 함</SelectItem>
              {vetsList.map((v) => (
                <SelectItem key={v.user_id} value={v.user_id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button size="sm" disabled={submitting} onClick={handleSave}>
              {submitting ? <LoaderCircleIcon size={14} className="animate-spin" /> : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

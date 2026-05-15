'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SubmitButton from '@/components/common/submit-button'
import { deleteOncologyCase, updateOncologyCaseStatus } from '@/lib/actions/oncology/case-actions'
import { ChevronDown, Trash2 } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'active',       label: '진행 중',  className: 'text-emerald-700' },
  { value: 'completed',    label: '완료',     className: 'text-blue-700' },
  { value: 'discontinued', label: '중단',     className: 'text-slate-600' },
  { value: 'deceased',     label: '사망',     className: 'text-red-700' },
]

const STATUS_COLOR: Record<string, string> = {
  active:       'bg-emerald-100 text-emerald-800',
  completed:    'bg-blue-100 text-blue-800',
  discontinued: 'bg-slate-100 text-slate-700',
  deceased:     'bg-red-100 text-red-800',
}

interface Props {
  caseId: string
  hosId: string
  targetDate: string
  patientName: string
  currentStatus: string
}

export default function OncologyCaseHeaderButtons({
  caseId,
  hosId,
  targetDate,
  patientName,
  currentStatus,
}: Props) {
  const router = useRouter()

  // Status change
  const [status, setStatus] = useState(currentStatus)
  const [changingStatus, setChangingStatus] = useState(false)

  const handleStatusChange = async (next: string) => {
    if (next === status) return
    setChangingStatus(true)
    try {
      await updateOncologyCaseStatus(caseId, next)
      setStatus(next)
      toast.success(`상태가 "${STATUS_OPTIONS.find(o => o.value === next)?.label}"으로 변경되었습니다.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경 실패')
    } finally {
      setChangingStatus(false)
    }
  }

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isDeleteReady = deleteInput.trim() === patientName.trim()

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDeleteReady) return
    setDeleting(true)
    try {
      await deleteOncologyCase(caseId)
      toast.success('케이스가 삭제되었습니다.')
      router.push(`/hospital/${hosId}/oncology/${targetDate}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Status dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={changingStatus}
            className={`h-7 gap-1 text-xs px-2 border ${STATUS_COLOR[status] ?? 'bg-slate-100 text-slate-700'}`}
          >
            {STATUS_OPTIONS.find(o => o.value === status)?.label ?? status}
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-28">
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`text-xs ${opt.className} ${status === opt.value ? 'font-semibold' : ''}`}
            >
              {opt.label}
              {status === opt.value && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete */}
      <Dialog open={deleteDialogOpen} onOpenChange={(v) => { setDeleteDialogOpen(v); if (!v) setDeleteInput('') }}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50">
            <Trash2 size={15} />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>케이스 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-slate-800">{patientName}</span>의 항암 케이스와 모든 관련 기록(프로토콜·투약·부작용·평가)이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <form className="w-full flex flex-col gap-3" onSubmit={handleDelete}>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="shrink-0">확인을 위해</span>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={patientName}
                  className="h-8 text-sm"
                  autoComplete="off"
                />
                <span className="shrink-0">을(를) 입력하세요.</span>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" size="sm">닫기</Button>
                </DialogClose>
                <SubmitButton
                  isPending={deleting}
                  disabled={!isDeleteReady}
                  buttonText="삭제"
                  variant="destructive"
                />
              </div>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

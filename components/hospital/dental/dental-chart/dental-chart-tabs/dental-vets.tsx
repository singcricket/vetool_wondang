'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator'
import { StethoscopeIcon, LoaderCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { Staff } from '@/lib/services/admin/staff'

type Props = {
  chartId: string
  hosId: string
  vetId: any // {id, role}[]
  staffs: Staff[]
}

export default function DentalVets({
  chartId,
  hosId,
  vetId,
  staffs,
}: Props) {
  const { refresh } = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 역할별 현재 값 추출
  const currentAttending = (vetId as any[])?.find(v => v.role === '담당의')?.id ?? 'none'
  const currentOperator = (vetId as any[])?.find(v => v.role === '술자')?.id ?? 'none'

  const [selectedAttendingId, setSelectedAttendingId] = useState(currentAttending)
  const [selectedOperatorId, setSelectedOperatorId] = useState(currentOperator)

  const attendingName = staffs.find(s => s.user_id === currentAttending)?.name ?? '미지정'
  const operatorName = staffs.find(s => s.user_id === currentOperator)?.name ?? '미지정'

  const handleSave = async () => {
    setIsSubmitting(true)
    
    // 신규 vet_id 배열 구성
    const newVets = []
    if (selectedAttendingId !== 'none') {
      newVets.push({ id: selectedAttendingId, role: '담당의' })
    }
    if (selectedOperatorId !== 'none') {
      newVets.push({ id: selectedOperatorId, role: '술자' })
    }

    try {
      await updateDentalChart(chartId, hosId, {
        vet_id: newVets as any
      })
      toast.success('담당의/술자를 변경하였습니다')
      setIsDialogOpen(false)
      refresh()
    } catch (error) {
      console.error(error)
      toast.error('변경에 실패하였습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          variant="outline"
          className="flex w-full items-center justify-start gap-2 px-2 h-10"
        >
          <StethoscopeIcon size={16} className="text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <span className="text-muted-foreground shrink-0 uppercase text-[10px] font-bold">담당의</span>
            <span className="font-medium truncate">{attendingName}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground shrink-0 uppercase text-[10px] font-bold">술자</span>
            <span className="font-medium truncate">{operatorName}</span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>담당의 / 술자 변경</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">담당의</label>
            <Select value={selectedAttendingId} onValueChange={setSelectedAttendingId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안 함</SelectItem>
                {staffs.filter(s => s.is_vet).map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-sm">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">술자</label>
            <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안 함</SelectItem>
                {staffs.filter(s => s.is_vet).map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-sm">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              닫기
            </Button>
            <Button size="sm" disabled={isSubmitting} onClick={handleSave}>
              {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
import { updateUltrasoundChart } from '@/lib/services/ultrasound/ultrasound-charts'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
  chartId: string
  vetId: string | null
  evaluatorId: string | null
  vetName: string | null
  evaluatorName: string | null
  vetList: { user_id: string; name: string }[]
}

export default function UltrasoundVets({
  chartId,
  vetId,
  evaluatorId,
  vetName,
  evaluatorName,
  vetList,
}: Props) {
  const { refresh } = useRouter()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVetId, setSelectedVetId] = useState(vetId ?? 'none')
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState(evaluatorId ?? 'none')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await updateUltrasoundChart(chartId, {
        vet_id: selectedVetId === 'none' ? null : selectedVetId,
        evaluator_id: selectedEvaluatorId === 'none' ? null : selectedEvaluatorId,
      })
      toast.success('담당의/검사자를 변경하였습니다')
      setIsSubmitting(false)
      setIsDialogOpen(false)
      refresh()
    } catch (error) {
      toast.error('변경 중 오류가 발생했습니다')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          variant="outline"
          className="flex w-full items-center justify-start gap-2 px-2"
        >
          <StethoscopeIcon size={16} className="text-muted-foreground" />
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <span className="text-muted-foreground">담당의</span>
            <span className="font-medium">{vetName ?? '미지정'}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">검사자</span>
            <span className="font-medium">{evaluatorName ?? '미지정'}</span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>담당의 / 검사자 변경</DialogTitle>
          <DialogDescription>
            해당 차트의 담당의와 검사자를 지정하거나 변경할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">담당의</label>
            <Select value={selectedVetId} onValueChange={setSelectedVetId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안 함</SelectItem>
                {vetList.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-sm">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">검사자</label>
            <Select value={selectedEvaluatorId} onValueChange={setSelectedEvaluatorId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안 함</SelectItem>
                {vetList.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-sm">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              닫기
            </Button>
            <Button size="sm" disabled={isSubmitting} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

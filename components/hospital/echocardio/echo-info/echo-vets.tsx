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
import { useEchoContext } from '@/providers/echo-context-provider'
import { updateEchoVets } from '@/lib/services/echocardio/update-echo'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
  echoId: string
  vetId: string | null
  examinerId: string | null
  vetName: string | null
  examinerName: string | null
}

export default function EchoVets({
  echoId,
  vetId,
  examinerId,
  vetName,
  examinerName,
}: Props) {
  const { refresh } = useRouter()
  const { echoContextData } = useEchoContext()
  const { vetsList } = echoContextData

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVetId, setSelectedVetId] = useState(vetId ?? 'none')
  const [selectedExaminerId, setSelectedExaminerId] = useState(examinerId ?? 'none')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    await updateEchoVets(
      echoId,
      selectedVetId === 'none' ? null : selectedVetId,
      selectedExaminerId === 'none' ? null : selectedExaminerId,
    )
    toast.success('담당의/검사자를 변경하였습니다')
    setIsSubmitting(false)
    setIsDialogOpen(false)
    refresh()
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
            <span className="font-medium">{examinerName ?? '미지정'}</span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>담당의 / 검사자 변경</DialogTitle>
          <DialogDescription />
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
                {vetsList.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-sm">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">검사자</label>
            <Select value={selectedExaminerId} onValueChange={setSelectedExaminerId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안 함</SelectItem>
                {vetsList.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-xs">
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
            <Button size="sm" disabled={isSubmitting} onClick={handleSave}>
              {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

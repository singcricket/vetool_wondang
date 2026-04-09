'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import WarningMessage from '@/components/common/warning-message'
import SubmitButton from '@/components/common/submit-button'
import { deleteEchoChart } from '@/lib/services/echocardio/delete-echo'
import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'

interface Props {
  chartDetail: EchoChartDetail
  hosId: string
  targetDate: string
}

export default function DeleteEchoChartDialog({
  chartDetail,
  hosId,
  targetDate,
}: Props) {
  const { push } = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteAvailable, setIsDeleteAvailable] = useState(false)

  const patientName = chartDetail.patient?.name || '미지정 환자'

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDeleting(true)
    try {
      await deleteEchoChart(chartDetail.id)
      toast.success('심초음파 차트가 삭제되었습니다')
      setIsDialogOpen(false)
      push(`/hospital/${hosId}/echocardio/${targetDate}`)
    } catch (error) {
      console.error(error)
      toast.error('삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.trim()
    setIsDeleteAvailable(input === patientName.trim())
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="mb-2">
            {patientName}의 {chartDetail.exam_date} 심초음파 차트를 삭제하시겠습니까?
          </DialogTitle>

          <DialogDescription className="flex flex-col gap-1">
            아래 입력칸에 환자 이름을 정확하게 입력해 주세요.
            <WarningMessage text="해당 작업은 실행 후 되돌릴 수 없습니다." />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <form className="flex w-full flex-col gap-4" onSubmit={handleDelete}>
            <div className="flex items-center gap-2 text-sm justify-end">
              <span>네,</span>
              <Input
                onChange={handleInputChange}
                type="text"
                className="w-32"
                placeholder={patientName}
              />
              <span className="shrink-0">의 차트를 삭제하겠습니다.</span>
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  닫기
                </Button>
              </DialogClose>

              <SubmitButton
                isPending={isDeleting}
                disabled={!isDeleteAvailable}
                buttonText="삭제"
                variant="destructive"
              />
            </div>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

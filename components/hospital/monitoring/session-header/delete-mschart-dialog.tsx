'use client'

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
import { Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import WarningMessage from '@/components/common/warning-message'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import SubmitButton from '@/components/common/submit-button'
import { deleteMs } from '@/lib/services/monitoring/update-ms'

type Props = {
  msData: MsWithPatientWithWeight
  hosId: string
  targetDate: string
}

export default function DeleteMsChartDialog({
  msData,
  hosId,
  targetDate,
}: Props) {
  const { target_date } = useParams()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeletingMsCharts, setIsDeletingMsCharts] = useState(false)
  const [isDeleteMsChartsAvailable, setIsDeleteMsChartsAvailable] =
    useState(false)

    const { push } = useRouter()

  const handleDeleteMsCharts = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setIsDeletingMsCharts(true)

    const delms = await deleteMs(msData.session_id)

    if(delms){
      toast.success(`모니터링 세션이 삭제되었습니다`)

      push(`/hospital/${hosId}/monitoring/${targetDate}/monitoring-session`)
    } else {
      toast.error("삭제 실패")
    }
  }

//   const isFirstChart = inDate === target_date
const changeinputpatientName = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if(msData.patient){
        msData.patient.name.trim() === event.target.value.trim()? setIsDeleteMsChartsAvailable(true): setIsDeleteMsChartsAvailable(false)
    } else{
        "미지정환자".trim() === event.target.value.trim()? setIsDeleteMsChartsAvailable(true): setIsDeleteMsChartsAvailable(false)
    }
    
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 size={18} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="mb-2">
            {msData.patient ? msData.patient.name + "의" : "미지정 환자의"} {msData.due_date+" "}모니터링 세션을 삭제하시겠습니까?
          </DialogTitle>

          <DialogDescription className="flex flex-col gap-1">
            아래 입력칸을 정확하게 채워 주세요
            <WarningMessage text="해당작업은 실행 후 되될릴 수 없습니다." />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
         <form
            className="flex flex-col items-end"
            onSubmit={handleDeleteMsCharts}
          >
            <div className="flex items-center gap-2 text-sm">
              <span>네,</span>
              <Input
                onChange={changeinputpatientName}
                type="text"
                className="w-28"
                placeholder={msData.patient? msData.patient.name : "미지정환자"}
              /> 
              <span className="shrink-0">의 모니터링 세션을 삭제하겠습니다.</span>
            </div>

            <div className="space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  닫기
                </Button>
              </DialogClose>

              <SubmitButton
                isPending={isDeletingMsCharts}
                disabled={!isDeleteMsChartsAvailable}
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

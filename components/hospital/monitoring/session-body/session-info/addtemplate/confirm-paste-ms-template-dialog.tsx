import SubmitButton from '@/components/common/submit-button'
import UserSelectItem from '@/components/hospital/common/user-select-item'
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

import { useSafeRefresh } from '@/hooks/use-safe-refresh'

import { MsTemplateChart, MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { postmsData,  updateMonitoringSession } from '@/lib/services/monitoring/update-ms'

import { CheckIcon } from 'lucide-react'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
  msData : MsWithPatientWithWeight
  msTemplate : MsTemplateChart
}


export default function ConfirmPasteMsTemplateDialog({
  setIsDialogOpen,

  msData,
  msTemplate,
}: Props) {
  const safeRefresh = useSafeRefresh()


  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePasteSelectedTemplate = async () => {
    setIsLoading(true)
   
    const postMschart : postmsData = {

      planned_vitals: msTemplate.planned_vitals ?? msData.planned_vitals,
      vital_results : msTemplate.vital_results ?? msData.vital_results,
      memo_tx : msTemplate.memo_tx ?? msData.memo_tx,
      interval_setting : msTemplate.interval_setting ?? msData.interval_setting ,
      memo_etc : msTemplate.memo_etc ?? msData.memo_etc

    }
    
    const update  =  updateMonitoringSession(msData.session_id, postMschart)
    toast.success('템플릿을 붙여넣었습니다')

    setIsLoading(false)
    setIsDialogOpen(false)

    safeRefresh()
  }

  return (
    <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <CheckIcon />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>모니터링 세션 템플릿 붙여넣기</DialogTitle>
          <DialogDescription className="rounded-md bg-destructive/10 p-3 text-destructive font-medium border border-destructive/20">
            선택한 템플릿을 붙여 넣습니다. 기존 작성한 자료는 템플릿으로 대체
            됩니다. 이 작업은 되돌릴 수 없습니다. 선택한 템플릿을 붙여
            넣겠습니까?
          </DialogDescription>
        </DialogHeader>

       
        <DialogFooter className="gap-2 md:gap-0">
          <DialogClose asChild>
            <Button size="sm" type="button" variant="outline" tabIndex={-1}>
              닫기
            </Button>
          </DialogClose>

          <SubmitButton
            buttonText="확인"
            onClick={handlePasteSelectedTemplate}
            isPending={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

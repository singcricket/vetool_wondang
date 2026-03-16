'use client'

import Autocomplete from '@/components/common/auto-complete/auto-complete'
import GroupBadge from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/group/group-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { updateMsTag } from '@/lib/services/monitoring/update-ms'
import { ComponentIcon } from 'lucide-react'
// import { updateClTag } from '@/lib/services/checklist/update-checklist'
import { useState } from 'react'
import { toast } from 'sonner'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { useRouter } from 'next/navigation'

type Props = {
  sessionId: string
  msTag: string|null
  msData:MsWithPatientWithWeight
}

export default function MsTag({ msTag, sessionId,msData }: Props) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [preTags, setPreTags]=useState(msTag??"")
  const handleUpdateChiefComplaint = async (value: string) => {
    const trimmedValue = value.trim()

    if (msTag === trimmedValue) {
      return
    }

   setPreTags(trimmedValue);
  }
  const saveTags = async () => {
    const trimmedValue = preTags.trim()

    if (msTag === trimmedValue && trimmedValue !== "") {
      setIsDialogOpen(false)
      return
    }

    setIsUpdating(true)
    
    // 현재 입력된 값을 콤마로 분리하여 배열로 만듬 (사용자 키워드)
    const keywordsArray = trimmedValue.split(',')
      .map(t => {
        const trimmed = t.trim()
        // 괄호 안의 내용 추출 (예: '심장병(HF)' -> 'HF')
        const match = trimmed.match(/\(([^)]+)\)/)
        return match ? match[1].trim() : trimmed
      })
      .filter(t => t.length > 0)
      
    const hosPatientId = msData.patient?.hos_patient_id ?? ""
    const hosOwnerId = msData.patient?.hos_owner_id ?? ""
    const patientName = msData.patient?.name ?? ""
    const patientGender = msData.patient?.gender ?? ""
    const patientSpecies = msData.patient?.species ?? ""
    const patientBreed = msData.patient?.breed ?? ""
    const ageInDays: string = msData.age_in_days?.toString() ?? "0"

    const success = await updateMsTag(
      sessionId,
      preTags??"",
      keywordsArray,
      hosPatientId,
      hosOwnerId,
      patientName,
      patientGender,
      patientSpecies,
      patientBreed,
      ageInDays
    )

    if (success) {
      toast.success('태그를 변경하였습니다')
      setIsDialogOpen(false)
      // router.refresh()
    }

    setIsUpdating(false)
  }
  
  

  return (
     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button   size="default"
              variant="outline"
              className="flex w-full items-center justify-start gap-2 px-2">
             
              {msTag?.length === 0 && (
                <span className="text-muted-foreground">태그</span>
              )}
              <GroupBadge currentGroups={msTag?.split(',') ?? []} />
            </Button>
          </DialogTrigger>
    
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>태그 수정</DialogTitle>
              <DialogDescription />
            </DialogHeader>
    
         <Autocomplete
      label="태그"
      defaultValue={msTag??""}
      handleUpdate={handleUpdateChiefComplaint}
      isUpdating={isUpdating}
    />
     <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={() => saveTags()}>저장</Button>
          </DialogFooter>
          </DialogContent>
         
        </Dialog>
    
  )
}

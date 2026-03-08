'use client'

import GroupBadge from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/group/group-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ComponentIcon, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsClSelectForm from './ms-cl-select-form'

type Props = {
 msData : MsWithPatientWithWeight
 clNames : string[]
}

export default function MsClSelect({ msData, clNames }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const DEFAULT_VITALS = [...clNames.slice(0,4)]

  // 초기값 설정: msData에 데이터가 있으면 사용, 없으면 DEFAULT_VITALS 사용
  const [selectedVitals, setSelectedVitals] = useState<string[]>(
    msData.planned_vitals ?? DEFAULT_VITALS
  )

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // 다이얼로그가 열릴 때 현재 msData 값으로 리셋
      setSelectedVitals(msData.planned_vitals ?? DEFAULT_VITALS)
    }
    setIsDialogOpen(open)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          size="default"
          variant="outline"
          className="flex w-full items-center justify-start gap-2 px-2"
        >
          <ListChecks size={16} className="text-muted-foreground" />
         
          <span className="text-muted-foreground">측정항목</span>
          <GroupBadge currentGroups={msData.planned_vitals ?? []} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>체크리스트 측정 항목 선택</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <MsClSelectForm
          sessionId={msData.session_id}
          setIsDialogOpen={setIsDialogOpen}
          selectedVitals={selectedVitals}
          setSelectedVitals={setSelectedVitals}
          clNames={clNames}
        />
      </DialogContent>
    </Dialog>
  )
}

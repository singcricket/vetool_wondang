'use client'
import { useContext } from 'react';
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { StethoscopeIcon } from 'lucide-react'
import { useState } from 'react'

// import VetsUpdateFormDynamic from './vets-update-form-dynamic'
import { MsVetSub } from '@/types/monitoring/monitoring-type';
import VetName from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/vets/vet-name';
import MsVetsUpdateForm from '@/components/hospital/monitoring/session-body/session-info/msvets/ms-vets-update-form';
import { Vet } from '@/types';

type Props = {
  mainVet: string | null
  primaryVet: string | null
  subVet: MsVetSub
  sessionId: string
  vetsListData : Vet[]
}

export default function Msvets({ mainVet, primaryVet, subVet, sessionId, vetsListData }: Props) {




  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const mainvet = vetsListData.find((vet) => vet.user_id === mainVet)?.name
  const primaryvet = vetsListData.find((vet) => vet.user_id === primaryVet)?.name
  const subvetName = {
    secondary: vetsListData.find((vet) => vet.user_id === subVet.secondary)?.name,
    anesthesia: vetsListData.find((vet) => vet.user_id === subVet.anesthesia)?.name,
    other: vetsListData.find((vet) => vet.user_id === subVet.other)?.name,
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

          <div className="flex items-center gap-2 overflow-hidden">
            <VetName label="주치의" name={mainvet ?? '미선택'} />

            <Separator orientation="vertical" className="h-4" />

            <VetName label="술자" name={primaryvet ?? '미선택'} />

           {subVet.secondary!=="" &&  <>
                <Separator orientation="vertical" className="h-4" />

                <VetName label="보조술자" name={subvetName.secondary ?? '미선택'} />
                </>}
               

                {subVet.anesthesia!=="" && <><Separator orientation="vertical" className="h-4" />

                <VetName label="마취의" name={subvetName.anesthesia ?? '미선택'} /></>}

                {subVet.other!=="" && <>
                <Separator orientation="vertical" className="h-4" />

                <VetName label="보조술자2" name={subvetName.other ?? '미선택'} />
                </>}
              
            
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>담당의 변경</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <MsVetsUpdateForm mainVet={mainVet} primaryVet={primaryVet} subVet={subVet} vetsList={vetsListData} setIsDialogOpen={setIsDialogOpen} sessionId = {sessionId} />
    
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { Button } from "@/components/ui/button"
import { Grid2X2, Grid2x2Check, PlusIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from 'react'

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClPlanTime({ msData }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    return (
        <div className="flex justify-between flex-col gap-2"> 
        <div className="flex gap-2">
<Button
           size="default"
                variant="outline"
                className="flex w-full items-center justify-start gap-2 px-2"
          >
          
          
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
          <div className="flex flex-1 items-center gap-1 overflow-hidden">
             <Grid2x2Check />
                <span className="shrink-0 text-xs ml-2 text-muted-foreground whitespace-nowrap">
                    측정시간 설정
                </span>
           </div>
         
          </DialogTrigger>
           <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>측정 시간 설정</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        
      </DialogContent>
    </Dialog>
    </Button>
        </div>
            
            
        </div>
    )
}
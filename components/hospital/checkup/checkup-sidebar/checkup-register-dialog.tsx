'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/utils'
import { PlusIcon } from 'lucide-react'
import CheckupSearchPatientTab from './checkup-search-patient-tab'

interface Props {
  hosId: string
  targetDate: string
  onRegistered: () => void
  className?: string
}

export default function CheckupRegisterDialog({ hosId, targetDate, onRegistered, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="px-2 pt-2">
          <Button
            size="sm"
            className={cn('w-full shrink-0 text-sm bg-teal-600 hover:bg-teal-700', className)}
          >
            <PlusIcon size={16} className="mr-1" />
            검진 등록
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent
        className="flex flex-col sm:max-w-[900px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>건강검진 등록</DialogTitle>
        <DialogDescription />
        <CheckupSearchPatientTab
          hosId={hosId}
          targetDate={targetDate}
          setOpen={setOpen}
          onRegistered={onRegistered}
        />
      </DialogContent>
    </Dialog>
  )
}

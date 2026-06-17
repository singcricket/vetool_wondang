'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusIcon } from 'lucide-react'
import DermSearchPatientTab from './derm-search-patient-tab'

interface Props {
  hosId: string
  targetDate: string
  onRegistered: () => void
}

export default function DermRegisterDialog({ hosId, targetDate, onRegistered }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) {} ; setOpen(v) }}>
      <DialogTrigger asChild>
        <Button size="sm" className="mx-2 my-1 shrink-0 text-xs bg-emerald-600 hover:bg-emerald-700">
          <PlusIcon size={14} />
          피부과 차트 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogTitle>피부과 차트 등록</DialogTitle>
        <DialogDescription />
        <DermSearchPatientTab
          hosId={hosId}
          targetDate={targetDate}
          setOpen={setOpen}
          onRegistered={onRegistered}
        />
      </DialogContent>
    </Dialog>
  )
}

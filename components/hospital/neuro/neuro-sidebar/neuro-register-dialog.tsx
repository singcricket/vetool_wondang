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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/utils'
import { PlusIcon } from 'lucide-react'
import NeuroSearchPatientTab from './neuro-search-patient-tab'
import NeuroNewPatientTab from './neuro-new-patient-tab'

interface NeuroRegisterDialogProps {
  hosId: string
  targetDate: string
  onRegistered: () => void
  className?: string
}

export default function NeuroRegisterDialog({
  hosId,
  targetDate,
  onRegistered,
  className,
}: NeuroRegisterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('search')

  const handleOpenChange = (next: boolean) => {
    if (next) setTab('search')
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={cn('shrink-0 pr-4 text-sm', className)}
        >
          <PlusIcon size={16} />
          신경계 차트 등록
        </Button>
      </DialogTrigger>

      <DialogContent
        className={cn('flex flex-col sm:max-w-[1200px]')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>신경계 차트 등록</DialogTitle>
        <DialogDescription />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="search" className="w-full">
              기존 환자
            </TabsTrigger>
            <TabsTrigger value="register" className="w-full">
              신규 환자
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <NeuroSearchPatientTab
              hosId={hosId}
              targetDate={targetDate}
              setOpen={setOpen}
              onRegistered={onRegistered}
            />
          </TabsContent>

          <TabsContent value="register">
            <NeuroNewPatientTab
              hosId={hosId}
              targetDate={targetDate}
              setOpen={setOpen}
              onRegistered={onRegistered}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

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
import OphthalmicSearchPatientTab from './ophthalmic-search-patient-tab'
import OphthalmicNewPatientTab from './ophthalmic-new-patient-tab'

interface OphthalmicRegisterDialogProps {
  hosId: string
  targetDate: string
  onRegistered: () => void
  className?: string
}

export default function OphthalmicRegisterDialog({
  hosId,
  targetDate,
  onRegistered,
  className,
}: OphthalmicRegisterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('search')

  const handleOpenChange = (next: boolean) => {
    if (next) setTab('search')
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="px-2 pt-2">
          <Button
            size="sm"
            className={cn('w-full shrink-0 text-sm bg-blue-600 hover:bg-blue-700', className)}
          >
            <PlusIcon size={16} className="mr-1" />
            안과 차트 등록
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent
        className={cn('flex flex-col sm:max-w-[1200px]')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>안과 검사 차트 등록</DialogTitle>
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
            <OphthalmicSearchPatientTab
              hosId={hosId}
              targetDate={targetDate}
              setOpen={setOpen}
              onRegistered={onRegistered}
            />
          </TabsContent>

          <TabsContent value="register">
            <OphthalmicNewPatientTab
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

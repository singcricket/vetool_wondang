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
import CheckupSearchPatientTab from './checkup-search-patient-tab'
import CheckupNewPatientTab from './checkup-new-patient-tab'
import CheckupOcrTab from './checkup-ocr-tab'

interface Props {
  hosId: string
  targetDate: string
  onRegistered: () => void
  className?: string
}

export default function CheckupRegisterDialog({ hosId, targetDate, onRegistered, className }: Props) {
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="search" className="w-full">기존 환자</TabsTrigger>
            <TabsTrigger value="register" className="w-full">신규 환자</TabsTrigger>
            <TabsTrigger value="ocr" className="w-full">EMR 사진</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <CheckupSearchPatientTab
              hosId={hosId}
              targetDate={targetDate}
              setOpen={setOpen}
              onRegistered={onRegistered}
            />
          </TabsContent>

          <TabsContent value="register">
            <CheckupNewPatientTab
              hosId={hosId}
              targetDate={targetDate}
              setOpen={setOpen}
              onRegistered={onRegistered}
            />
          </TabsContent>

          <TabsContent value="ocr">
            <CheckupOcrTab
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

'use client'

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
import { useState } from 'react'
import MsSearchPatientContainer from '@/components/hospital/monitoring/sidebar/ms-register-dialog/ms-search-patient-container'
import MsPatientRegisterForm from '@/components/hospital/monitoring/sidebar/ms-register-dialog/ms-patient-register-form'


type Props = {
  hosId: string
  targetDate: string
  isEmergency?: boolean
}

export default function MsRegisterDialog({
  hosId,
  targetDate,
  
}: Props) {
  const [tab, setTab] = useState('search')
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  const handleTabValueChange = (value: string) => {
    if (value === 'search') {
      setTab('search')
      return
    }

    if (value === 'register') {
      setTab('register')
      return
    }
  }

  const handleOpenChage = (open: boolean) => {
    if (open) {
      setTab('search')
    }
    setIsRegisterDialogOpen(open)
  }

  return (
    <Dialog open={isRegisterDialogOpen} onOpenChange={handleOpenChage}>
      <DialogTrigger asChild>
        <Button size="sm" className='pr-4 text-sm'>
          <PlusIcon />
         모니터링 세션 등록
        </Button>
      </DialogTrigger>

      <DialogContent
        className={cn('flex flex-col sm:max-w-[1200px]')}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>모니터링 세션 등록</DialogTitle>
        <DialogDescription />

        <Tabs
          defaultValue="search"
          onValueChange={handleTabValueChange}
          value={tab}
        >
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="search" className="w-full">
              기존 환자
            </TabsTrigger>

            <TabsTrigger value="register" className="w-full">
              신규 환자
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <MsSearchPatientContainer
              hosId={hosId}
              targetDate={targetDate}
              setIsRegisterDialogOpen={setIsRegisterDialogOpen}
            />
          </TabsContent>

          <TabsContent value="register">
            <MsPatientRegisterForm
              hosId={hosId}
              targetDate={targetDate}
              setIsDialogOpen={setIsRegisterDialogOpen}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import PatientDetailInfo from '@/components/hospital/common/patient/patient-detail-info'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { MsPatient } from '@/lib/services/monitoring/fetch-ms-data'
import { useState } from 'react'
import MsPatientRegisterForm from '@/components/hospital/monitoring/sidebar/ms-register-dialog/ms-patient-register-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MsSearchPatientContainer from '@/components/hospital/monitoring/sidebar/ms-register-dialog/ms-search-patient-container'

type Props = {
  hosId: string
  targetDate: string
  patient: MsPatient | null
  sessionId: string
}

export default function MsPatientUpdateDialog({
  hosId,
  targetDate,
  patient,
  sessionId,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tab, setTab] = useState('search')

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

  

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={patient ? 'ghost' : 'outline'}
          className="text-xs font-semibold md:text-sm 2xl:text-base"
          size={patient ? 'default' : 'sm'}
        >
          {patient ? (
            <PatientDetailInfo
              species={patient.species}
              name={patient.name}
              breed={patient.breed}
              gender={patient.gender}
              birth={patient.birth}
              weight={patient.body_weight ?? ''}
              weightMeasuredDate={patient.weight_measured_date}
              isAlive={patient.is_alive}
              hosPatientId={patient.hos_patient_id}
            />
          ) : (
            '환자 연결'
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>
            {patient ? `${patient.name} 정보 수정` : '환자 등록 및 연결'}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

       {patient ? (
         <MsPatientRegisterForm
          patient={patient}
          hosId={hosId}
          targetDate={targetDate}
          setIsDialogOpen={setIsDialogOpen}
          isEdit={!!patient}
        />
       ) : (
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
              setIsRegisterDialogOpen={setIsDialogOpen}
                isSessionUpdatePatient = {true}
          sessionId={sessionId}
            />
          </TabsContent>

          <TabsContent value="register">
            <MsPatientRegisterForm
              hosId={hosId}
              targetDate={targetDate}
              setIsDialogOpen={setIsDialogOpen}
              isSessionUpdatePatient = {true}
          sessionId={sessionId}
        />
        </TabsContent>
        </Tabs>
       )}
      </DialogContent>
    </Dialog>
  )
}

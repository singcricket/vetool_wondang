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
import MsPatientRegisterForm from '../sidebar/ms-register-dialog/ms-patient-register-form'

type Props = {
  hosId: string
  targetDate: string
  patient: MsPatient | null
}

export default function MsPatientUpdateDialog({
  hosId,
  targetDate,
  patient,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

        <MsPatientRegisterForm
          patient={patient}
          hosId={hosId}
          targetDate={targetDate}
          setIsDialogOpen={setIsDialogOpen}
          isEdit={!!patient}
        />
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import PatientDetailInfo from '@/components/hospital/common/patient/patient-detail-info'
import DentalPatientEditForm from './dental-patient-edit-form'
import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = {
  chartDetail: DentalChartDetail
}

export default function DentalPatientUpdateDialog({ chartDetail }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { patient, patient_id } = chartDetail

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-xs font-semibold md:text-sm 2xl:text-base"
        >
          <PatientDetailInfo
            species={patient.species}
            name={patient.name}
            breed={patient.breed}
            gender={patient.gender || ''}
            birth={patient.birth || ''}
            weight="" // 치과 차트는 현재 몸무게를 따로 차트 내에 저장하지 않음
            weightMeasuredDate={null}
            isAlive={true}
            hosPatientId={patient.hos_patient_id}
          />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{patient.name} 정보 수정</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <DentalPatientEditForm
          patient={patient}
          patientId={patient_id}
          setIsDialogOpen={setIsDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}

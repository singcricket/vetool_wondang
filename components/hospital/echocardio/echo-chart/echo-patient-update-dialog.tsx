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
import EchoPatientEditForm from './echo-patient-edit-form'
import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'

type Props = {
  chartDetail: EchoChartDetail
}

export default function EchoPatientUpdateDialog({ chartDetail }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { patient, patient_id, results, exam_date } = chartDetail

  const bwResult = results.find((r) => r.keyword_id === 'BW_kg')
  const weight = bwResult?.value ?? ''
  const weightMeasuredDate = bwResult?.value ? exam_date : null

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
            gender={patient.gender}
            birth={patient.birth}
            weight={weight}
            weightMeasuredDate={weightMeasuredDate}
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

        <EchoPatientEditForm
          patient={patient}
          patientId={patient_id}
          echoId={chartDetail.id}
          patientWeight={weight}
          setIsDialogOpen={setIsDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}

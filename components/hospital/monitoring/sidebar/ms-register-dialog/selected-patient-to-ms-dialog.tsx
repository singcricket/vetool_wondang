import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { registerMonitoringSession } from '@/lib/services/monitoring/ms-register'
import { updateMsPatient } from '@/lib/services/monitoring/update-ms'
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { toast } from 'sonner'
import type { Patient } from '@/types'
import { format } from 'date-fns'
import { getDaysSince } from '@/lib/utils/utils'

type Props = {
  patient: Patient
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: Dispatch<SetStateAction<boolean>>
  isSessionUpdatePatient?: boolean
  sessionId?: string
}

export default function SelectedPatientToMsDialog({
  patient,
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  isSessionUpdatePatient,
  sessionId,
}: Props) {
  const { push } = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    if(isSessionUpdatePatient && sessionId){
      const updatemspatient = await updateMsPatient(
        sessionId,
        patient.patient_id,
        patient.birth,
        "#"+patient.hos_patient_id+"#"+patient.hos_owner_id+"#"+patient.name+"#"+patient.species+"#"+patient.breed+"#"+patient.gender+"#"+getDaysSince(format(patient.birth, 'yyyy-MM-dd'))
      )
      if(updatemspatient){
        setIsSubmitting(false)
        setIsConfirmDialogOpen(false)
        setIsRegisterDialogOpen(false)
        toast.success('모니터링 세션에 환자 정보 추가 완료')
      }
    }else{
        const returningSessionId = await registerMonitoringSession(
      hosId,
      targetDate,
      patient.patient_id,
      patient.birth,
      "#"+patient.hos_patient_id+"#"+patient.hos_owner_id+"#"+patient.name+"#"+patient.species+"#"+patient.breed+"#"+patient.gender+"#"+getDaysSince(format(patient.birth, 'yyyy-MM-dd'))
    )

    // toast({
    //   title: `${name} 체크리스트 등록 완료`,
    // })

    setIsSubmitting(false)
    setIsConfirmDialogOpen(false)
    setIsRegisterDialogOpen(false)

    push(
      `/hospital/${hosId}/monitoring/${targetDate}/monitoring-session/${returningSessionId}/session`,
    )
    }
   
  }

  return (
    <AlertDialog
      open={isConfirmDialogOpen}
      onOpenChange={setIsConfirmDialogOpen}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" size="icon" variant="ghost">
          <CheckIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="gap-0">
        <AlertDialogHeader>
          <AlertDialogTitle>모니터링 세션 등록</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {targetDate}에 {patient.name}(이)의 모니터링세션에 등록 하시겠습니까 ?
        </AlertDialogDescription>

        <AlertDialogFooter className="pt-8">
          <AlertDialogCancel>닫기</AlertDialogCancel>

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-14"
          >
            {isSubmitting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              '확인'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

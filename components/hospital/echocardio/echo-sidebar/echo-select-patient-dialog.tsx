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
import { registerEchoChart } from '@/lib/services/echocardio/register-echo'
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'
import type { Patient } from '@/types'

type Props = {
  patient: Patient
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function EchoSelectPatientDialog({
  patient,
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
  onRegistered,
}: Props) {
  const { push } = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)

    const echoId = await registerEchoChart({
      hosId,
      patientId: patient.patient_id,
      examDate: targetDate,
      patient: {
        hos_patient_id: patient.hos_patient_id,
        hos_owner_id: patient.hos_owner_id ?? null,
        name: patient.name,
        species: patient.species,
        breed: patient.breed,
        gender: patient.gender,
        birth: patient.birth,
      },
    })

    setIsSubmitting(false)
    setOpen(false)
    setIsRegisterDialogOpen(false)
    onRegistered()
    push(`/hospital/${hosId}/echocardio/${targetDate}/${echoId}`)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="icon" variant="ghost">
          <CheckIcon />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="gap-0">
        <AlertDialogHeader>
          <AlertDialogTitle>심초차트 등록</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {targetDate}에 {patient.name}(이)의 심초차트를 등록 하시겠습니까?
        </AlertDialogDescription>

        <AlertDialogFooter className="pt-8">
          <AlertDialogCancel>닫기</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="w-14">
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

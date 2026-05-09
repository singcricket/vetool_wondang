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
import { registerNeuroChart } from '@/lib/services/neuro/register-neuro'
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'
import type { Patient } from '@/types'
import { toast } from 'sonner'

type Props = {
  patient: Patient
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function NeuroSelectPatientDialog({
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

    try {
      const chartId = await registerNeuroChart({
        hosId,
        patientId: patient.patient_id,
        targetDate,
        evaluatorId: null, // 초기 차트 생성 시 evaluatorId는 나중에 설정
      })

      setIsSubmitting(false)
      setOpen(false)
      setIsRegisterDialogOpen(false)
      onRegistered()
      push(`/hospital/${hosId}/neuro/${targetDate}/${chartId}`)
    } catch (e: any) {
      toast.error(e.message || '차트 생성 실패')
      setIsSubmitting(false)
    }
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
          <AlertDialogTitle>신경학적 검사 차트 등록</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {targetDate}에 {patient.name}(이)의 신경계 차트를 등록 하시겠습니까?
        </AlertDialogDescription>

        <AlertDialogFooter className="pt-8">
          <AlertDialogCancel>닫기</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="w-14 bg-blue-600 hover:bg-blue-700">
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

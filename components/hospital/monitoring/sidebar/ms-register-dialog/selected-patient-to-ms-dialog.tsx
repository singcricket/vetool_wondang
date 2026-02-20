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
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useState } from 'react'

type Props = {
  patientId: string
  name: string
  birth: string
  hosId: string
  targetDate: string
  setIsRegisterDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function SelectedPatientToMsDialog({
  patientId,
  name,
  birth,
  hosId,
  targetDate,
  setIsRegisterDialogOpen,
}: Props) {
  const { push } = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)

    const returningSessionId = await registerMonitoringSession(
      hosId,
      targetDate,
      patientId,
      birth,
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
          {targetDate}에 {name}(이)의 모니터링세션에 등록 하시겠습니까 ?
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

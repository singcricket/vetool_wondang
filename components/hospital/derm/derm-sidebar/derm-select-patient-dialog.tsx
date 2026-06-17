'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { registerDermChart } from '@/lib/services/derm/register-derm'
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Patient } from '@/types'

type Props = {
  patient: Patient
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function DermSelectPatientDialog({
  patient, hosId, targetDate, setOpen, onRegistered,
}: Props) {
  const { push } = useRouter()
  const [open, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const chartId = await registerDermChart({
        hosId,
        patientId: patient.patient_id,
        targetDate,
        visitType: 'initial',
      })
      setDialogOpen(false)
      setOpen(false)
      onRegistered()
      push(`/hospital/${hosId}/derm/${targetDate}/${chartId}` as any)
    } catch (e: any) {
      toast.error(e.message || '차트 생성 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="icon" variant="ghost">
          <CheckIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>피부과 차트 등록</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {targetDate}에 {patient.name}(이)의 피부과 차트를 등록하시겠습니까?
        </AlertDialogDescription>
        <AlertDialogFooter className="pt-6">
          <AlertDialogCancel>취소</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : '확인'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

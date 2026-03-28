'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { LoaderCircleIcon, Settings2Icon, Trash2Icon } from 'lucide-react'
import { deleteEchoChart } from '@/lib/services/echocardio/delete-echo'
import EchoSettingsPanel from '../echo-settings/echo-settings-panel'

type Props = {
  hosId: string
  targetDate: string
  echoId: string
}

export default function EchoHeaderRightButtons({
  hosId,
  targetDate,
  echoId,
}: Props) {
  const { push } = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteEchoChart(echoId)
    push(`/hospital/${hosId}/echocardio/${targetDate}`)
  }

  return (
    <div className="flex items-center gap-1">
      {/* 설정 버튼 */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => setShowSettings(true)}
      >
        <Settings2Icon className="h-4 w-4" />
      </Button>

      {/* 차트 삭제 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="gap-0">
          <AlertDialogHeader>
            <AlertDialogTitle>심초차트 삭제</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            이 차트와 모든 검사 결과가 삭제됩니다. 계속하시겠습니까?
          </AlertDialogDescription>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeleting}
              className="w-16"
              onClick={handleDelete}
            >
              {isDeleting ? <LoaderCircleIcon className="animate-spin" /> : '삭제'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 설정 패널 */}
      {showSettings && (
        <EchoSettingsPanel hosId={hosId} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

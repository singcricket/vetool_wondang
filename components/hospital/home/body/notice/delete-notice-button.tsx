'use client'
'use no memo'

import { Button } from '@/components/ui/button'
import { deleteNotice } from '@/lib/services/hospital-home/notice'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction } from 'react'

type DeleteNoticeButtonProps = {
  noticeId: string
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
  onDeleteSuccess?: () => void
}
export default function DeleteNoticeButton({
  noticeId,
  setIsDialogOpen,
  onDeleteSuccess,
}: DeleteNoticeButtonProps) {
  const { refresh } = useRouter()

  const handleDeleteNotice = async () => {
    setIsDialogOpen(false)

    await deleteNotice(noticeId)

    if (onDeleteSuccess) {
      onDeleteSuccess()
    } else {
      refresh()
    }
  }

  return (
    <Button type="button" variant="destructive" onClick={handleDeleteNotice}>
      삭제
    </Button>
  )
}

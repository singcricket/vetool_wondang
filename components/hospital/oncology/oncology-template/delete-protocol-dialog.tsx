'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { deleteProtocol } from '@/lib/actions/oncology/protocol-template-actions'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  protocolId: string
  protocolName: string
}

export default function DeleteProtocolDialog({ protocolId, protocolName }: Props) {
  const { refresh } = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProtocol(protocolId)
      toast.success('프로토콜을 삭제하였습니다')
      refresh()
    } catch {
      toast.error('삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 size={16} />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{protocolName} 프로토콜을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            해당 작업은 되돌릴 수 없습니다. 케이스에서 사용 중인 프로토콜은 삭제할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>닫기</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            삭제
            {isDeleting && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

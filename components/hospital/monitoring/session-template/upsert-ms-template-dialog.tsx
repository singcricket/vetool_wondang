'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Edit2Icon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { MsTemplateChart } from '@/lib/services/monitoring/fetch-ms-data'
import MsTemplateEdit from './session-template-edit/ms-template-edit'

type Props = EditTemplateProps 

type EditTemplateProps = {
  hosId: string
  isEdit: true
  mstemplate: MsTemplateChart
}

export default function UpsertMsTemplateDialog({
  hosId,
  isEdit,
  mstemplate,
}: Props) {
  const [isFetching, setIsFetching] = useState(false)
  const [isUpsertTemplateDialogOpen, setIsUpsertTemplateDialogOpen] =
    useState(false)
  


  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsUpsertTemplateDialogOpen(open)
    } else {
      setIsUpsertTemplateDialogOpen(open)
    }
  }

  return (
    <Dialog open={isUpsertTemplateDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant={isEdit ? 'ghost' : 'default'}
          className={isEdit ? '' : 'fixed bottom-16 right-6 rounded-full'}
          disabled={isFetching}
        >
          {isEdit ? (
            <>{isFetching ? <Spinner /> : <Edit2Icon />}</>
          ) : (
            <PlusIcon />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="md:max-w-[1600px]"
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? `모니터링 세션 템플릿 수정` : '모니터링 세션 템플릿 만들기'}</DialogTitle>
          <VisuallyHidden>
            <DialogDescription />
          </VisuallyHidden>
        </DialogHeader>

        <div className="max-h-[800px] overflow-scroll">
         <MsTemplateEdit mstemplate={mstemplate} hosId={hosId} isEdit={isEdit} onOpenChange={handleOpenChange}/>
        </div>

    
      </DialogContent>
    </Dialog>
  )
}

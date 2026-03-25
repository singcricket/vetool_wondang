'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import NotesCreateForm from './notes-create-form'

interface Props {
  defaultCategory?: string | null
}

export default function NotesCreateDialog({ defaultCategory }: Props) {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="flex items-center gap-2 pr-4 text-sm font-bold bg-primary hover:bg-primary/90"
        >
          <PlusIcon size={18} />
          <span>새 노트 작성</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>새 노트 작성</DialogTitle>
        </VisuallyHidden>
        <NotesCreateForm 
          isDialog 
          onDone={handleClose} 
          defaultCategory={defaultCategory} 
        />
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  UserIcon, 
  EditIcon, 
  CopyIcon,
  XIcon,
  TagIcon,
  HashIcon 
} from 'lucide-react'
import { format } from 'date-fns'
import NotesEditor from '../notes-create/notes-editor'
import NotesCreateForm from '../notes-create/notes-create-form'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  note: NoteWithAuthor
  children: React.ReactNode
}

export default function NotesViewDialog({ note, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCopy = () => {
    setIsCopying(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCopying(false)
  }


  const handleDone = () => {
    setIsEditing(false)
    setIsOpen(false)
    window.location.reload() 
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setIsEditing(false)
        setIsCopying(false)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-none shadow-2xl flex flex-col [&>button]:hidden">
        {isEditing || isCopying ? (
          <NotesCreateForm 
            isDialog 
            onDone={handleDone} 
            onCancel={handleCancel}
            editNoteId={isEditing ? note.notes_id : null} 
            copyNoteId={isCopying ? note.notes_id : null}
          />
        ) : (
          <div className="flex flex-col h-full bg-white">
            {/* View Header */}
            <div className="flex h-auto py-5 items-center justify-between px-8 border-b shrink-0 bg-slate-50/70 backdrop-blur-sm">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <DialogTitle className="text-3xl font-black text-slate-900 line-clamp-2 tracking-tighter">
                  {note.title}
                </DialogTitle>
                <div className="flex flex-wrap gap-1.5">
                  {note.user_tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-white text-blue-600 border-blue-100 shadow-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5 text-xs border-slate-200 font-bold px-4"
                  onClick={handleEdit}
                >
                  <EditIcon size={14} />
                  수정하기
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5 text-xs border-slate-200 font-bold px-4 hover:bg-slate-50 transition-colors"
                  onClick={handleCopy}
                >
                  <CopyIcon size={14} />
                  복사하기
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  취소
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8 max-w-[1000px] mx-auto space-y-8">
                {/* Meta Info Section */}
                <div className="grid grid-cols-2 gap-4 pb-8 border-b border-slate-100">
                   <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                         <UserIcon size={12} /> 작성자
                      </span>
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-700">{note.author?.name}</span>
                         <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{note.author?.position}</span>
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                         <CalendarIcon size={12} /> 작성일
                      </span>
                      <div className="font-medium text-slate-600">
                         {note.created_at ? format(new Date(note.created_at), 'yyyy년 MM월 dd일 HH:mm') : '-'}
                      </div>
                   </div>
                </div>

                {/* Content Body */}
                <div className="min-h-[500px]">
                  <NotesEditor 
                    content={note.content} 
                    hosId={note.hos_id} 
                    editable={false} 
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

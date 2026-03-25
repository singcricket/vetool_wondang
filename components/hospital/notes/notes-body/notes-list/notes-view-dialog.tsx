'use client'

import { useState } from 'react'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarIcon, 
  UserIcon, 
  EditIcon, 
  CopyIcon,
  XIcon,
  Trash2Icon,
} from 'lucide-react'
import { format } from 'date-fns'
import { deleteNote } from '@/lib/services/notes/notes'
import { toast } from 'sonner'
import NotesEditor from '../notes-create/notes-editor'
import NotesCreateForm from '../notes-create/notes-create-form'
import { ScrollArea } from '@/components/ui/scroll-area'
import NotesRelatedPanel from '../../notes-search/notes-related-panel'
import { cn } from '@/lib/utils/utils'

interface Props {
  note: NoteWithAuthor
  children: React.ReactNode
}

export default function NotesViewDialog({ note, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  /** 메인 뷰에 현재 표시 중인 노트. 우측 패널에서 교체 가능 */
  const [viewingNote, setViewingNote] = useState<NoteWithAuthor>(note)
  /** 연관 노트 패널에서 검색 중인 태그. null이면 패널 닫힘 */
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const handleEdit = () => setIsEditing(true)
  const handleCopy = () => setIsCopying(true)
  const handleCancel = () => {
    setIsEditing(false)
    setIsCopying(false)
  }

  const handleDone = () => {
    setIsEditing(false)
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('notes-updated'))
  }

  const handleDelete = async () => {
    try {
      await deleteNote(viewingNote.notes_id)
      toast.success('노트가 삭제되었습니다')
      setIsOpen(false)
    } catch (error) {
      toast.error('삭제에 실패했습니다')
      console.error(error)
    }
  }

  /** 패널의 Maximize 클릭 시 메인 뷰를 해당 노트로 교체 */
  const handleSelectNote = (selected: NoteWithAuthor) => {
    setViewingNote(selected)
    setActiveTag(null)  // 패널 닫기 (필요 시 열어둘 수도 있음)
  }

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setIsEditing(false)
        setIsCopying(false)
        setActiveTag(null)
        setViewingNote(note)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-none shadow-2xl flex flex-col [&>button]:hidden"
        onEscapeKeyDown={(e) => {
          if (isEditing || isCopying) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (isEditing || isCopying) e.preventDefault()
        }}
      >
        {isEditing || isCopying ? (
          <NotesCreateForm 
            isDialog 
            onDone={handleDone} 
            onCancel={handleCancel}
            editNoteId={isEditing ? viewingNote.notes_id : null} 
            copyNoteId={isCopying ? viewingNote.notes_id : null}
          />
        ) : (
          <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* ── View Header ─────────────────────────────────────────── */}
            <div className="flex flex-wrap h-auto py-4 sm:py-5 items-center justify-between gap-4 pl-4 sm:pl-8 pr-6 sm:pr-12 border-b shrink-0 bg-slate-50/70 backdrop-blur-sm">
              {/* Left Group: Title & Tags */}
              <div className="flex flex-col gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
                {/* 원본 노트와 다른 노트를 보는 경우 breadcrumb 표시 */}
                {viewingNote.notes_id !== note.notes_id && (
                  <p className="text-[10px] text-slate-400 font-semibold pb-0.5">
                    ← 연관 노트 열람 중
                  </p>
                )}
                <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 line-clamp-2 tracking-tighter">
                  {viewingNote.title}
                </DialogTitle>

                {/* Clickable tag badges */}
                <div className="flex flex-wrap gap-1.5">
                  {viewingNote.user_tags?.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      onClick={() => handleTagClick(tag)}
                      title={`'${tag}' 연관 노트 검색`}
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold shadow-sm cursor-pointer select-none transition-all duration-200',
                        // 태블릿/PC에서만 클릭 가능한 시각적 피드백
                        'md:hover:scale-105 md:hover:shadow-md',
                        activeTag === tag
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 ring-offset-1'
                          : 'bg-white text-blue-600 border-blue-100 md:hover:bg-blue-50',
                      )}
                    >
                      #{tag}
                      {/* 태블릿 이상에서만 연관검색 힌트 아이콘 표시 */}
                      <span className="hidden md:inline ml-1 opacity-50">↗</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Right Group: Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5 text-xs border-slate-200 font-bold px-2 sm:px-4"
                  onClick={handleEdit}
                >
                  <EditIcon size={14} />
                  <span className="hidden sm:inline">수정하기</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5 text-xs border-slate-200 font-bold px-2 sm:px-4 hover:bg-slate-50 transition-colors"
                  onClick={handleCopy}
                >
                  <CopyIcon size={14} />
                  <span className="hidden sm:inline">복사하기</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 gap-1.5 text-xs border-slate-200 font-bold px-2 sm:px-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2Icon size={14} />
                      <span className="hidden sm:inline">삭제하기</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        삭제 후 복구는 되지 않습니다. 신중하게 결정해주세요.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-xs font-bold">취소</AlertDialogCancel>
                      <AlertDialogAction 
                         className="bg-red-500 hover:bg-red-600 font-bold text-xs"
                         onClick={handleDelete}
                      >
                         삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5 px-2 sm:px-4 text-xs font-bold border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <XIcon size={14} />
                  <span className="hidden sm:inline">창 닫기</span>
                </Button>
              </div>
            </div>

            {/* ── Body: Main Content + Related Panel ──────────────────── */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main Note Content */}
              <ScrollArea className={cn(
                'flex-1 transition-all duration-300',
                activeTag ? 'md:basis-[60%]' : 'basis-full'
              )}>
                <div className="p-4 sm:p-8 max-w-[1000px] mx-auto space-y-8">
                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4 pb-8 border-b border-slate-100">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserIcon size={12} /> 작성자
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{viewingNote.author?.name}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{viewingNote.author?.position}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarIcon size={12} /> 작성일
                      </span>
                      <div className="font-medium text-slate-600">
                        {viewingNote.created_at ? format(new Date(viewingNote.created_at as string), 'yyyy년 MM월 dd일 HH:mm') : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="min-h-[500px]">
                    <NotesEditor 
                      content={viewingNote.content} 
                      hosId={viewingNote.hos_id} 
                      editable={false} 
                    />
                  </div>
                </div>
              </ScrollArea>

              {/* Related Notes Panel - 태블릿/PC에서만 표시 (md 이상) */}
              {activeTag && (
                <div className="hidden md:flex md:basis-[40%] max-w-[420px] shrink-0 overflow-hidden">
                  <NotesRelatedPanel
                    hosId={viewingNote.hos_id}
                    tag={activeTag}
                    currentNoteId={viewingNote.notes_id}
                    onClose={() => setActiveTag(null)}
                    onSelectNote={handleSelectNote}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

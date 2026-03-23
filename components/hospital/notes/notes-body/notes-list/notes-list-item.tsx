'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { CalendarIcon, UserIcon, TagIcon, ChevronRightIcon } from 'lucide-react'
import { format } from 'date-fns'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import NotesViewDialog from './notes-view-dialog'

interface Props {
  note: NoteWithAuthor
}

export default function NotesListItem({ note }: Props) {
  return (
    <NotesViewDialog note={note}>
      <Card 
        className="group cursor-pointer border-0 shadow-sm transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] overflow-hidden bg-white hover:bg-slate-50/50"
      >
        <CardHeader className="group-hover:bg-blue-50/10 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
              <TagIcon size={12} strokeWidth={3} />
              {note.user_tags?.[0] || '기타'}
            </span>
          </div>
          <CardTitle className="text-xl font-bold leading-tight line-clamp-2 text-slate-900 group-hover:text-blue-700 transition-colors">
            {note.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
           <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">
             {note.content ? '기록된 내용이 있습니다. 본문 확인을 위해 클릭하세요.' : '내용이 없습니다.'}
           </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-slate-400 border-t pt-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <CalendarIcon size={12} />
              {note.created_at ? format(new Date(note.created_at), 'yyyy.MM.dd') : '날짜 없음'}
            </span>
            <span className="flex items-center gap-1">
              <UserIcon size={12} />
              <span className="font-semibold text-slate-600">
                 {note.author?.name || '작성자 미상'}
              </span>
              {note.author?.position && (
                <span className="text-[10px] opacity-70">({note.author.position})</span>
              )}
            </span>
          </div>
          <ChevronRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
        </CardFooter>
      </Card>
    </NotesViewDialog>
  )
}

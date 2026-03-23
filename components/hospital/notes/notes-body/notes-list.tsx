'use client'

import { useEffect, useState } from 'react'
import { getNotes, getNotesByTag } from '@/lib/services/notes/notes'
import { Note } from '@/types/notes/notes_index'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon, UserIcon, TagIcon, ChevronRightIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  category: string | null
}

const mockNotesPlaceholder = [1, 2, 3, 4, 5, 6]

export default function NotesList({ category }: Props) {
  const { hos_id } = useParams()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true)
      try {
        if (category) {
          const fetched = await getNotesByTag(hos_id as string, category)
          setNotes(fetched)
        } else {
          const fetched = await getNotes(hos_id as string)
          setNotes(fetched)
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error)
      } finally {
        setLoading(false)
      }
    }

    if (hos_id) fetchNotes()
  }, [hos_id, category])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockNotesPlaceholder.map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!loading && notes.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-slate-200 p-6 rounded-full">
          <CalendarIcon size={48} className="text-slate-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-serif text-slate-800">기록된 노트가 없습니다</h3>
          <p className="text-slate-500 mt-2">새로운 노트를 작성하여 병원의 지식을 공유해보세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {notes.map((note) => (
        <Card 
          key={note.notes_id} 
          className="group cursor-pointer border-0 shadow-sm transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] overflow-hidden"
        >
          <CardHeader className="bg-white group-hover:bg-blue-50/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                <TagIcon size={12} strokeWidth={3} />
                {note.tags?.[0] || '기타'}
              </span>
            </div>
            <CardTitle className="text-xl font-bold leading-tight line-clamp-2 text-slate-900 group-hover:text-blue-700 transition-colors">
              {note.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
             <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">
               {/* Extract text from json content (placeholder for now) */}
               {note.content ? '기록된 내용이 있습니다. 본문 확인을 위해 클릭하세요.' : '내용이 없습니다.'}
             </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center text-xs text-slate-400 border-t pt-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CalendarIcon size={12} />
                {note.created_at ? format(new Date(note.created_at), 'yyyy.MM.dd') : '날짜 없음'}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon size={12} />
                진료팀
              </span>
            </div>
            <ChevronRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

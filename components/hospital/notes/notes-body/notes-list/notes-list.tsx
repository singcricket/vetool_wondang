'use client'

import { useEffect, useState, useCallback } from 'react'
import { getNotes, getNotesByTag } from '@/lib/services/notes/notes'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import { useParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon } from 'lucide-react'
import NotesListItem from './notes-list-item'

interface Props {
  category: string | null
}

const mockNotesPlaceholder = [1, 2, 3, 4, 5, 6]

export default function NotesList({ category }: Props) {
  const { hos_id } = useParams()
  const [notes, setNotes] = useState<NoteWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const fetchNotes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      if (category) {
        const fetched = await getNotesByTag(hos_id as string, category)
        setNotes(fetched as NoteWithAuthor[])
      } else {
        const fetched = await getNotes(hos_id as string)
        setNotes(fetched as NoteWithAuthor[])
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [hos_id, category])

  // 초기 로드 성격의 useEffect
  useEffect(() => {
    if (hos_id) fetchNotes(false)
  }, [hos_id, fetchNotes])

  // 실시간 변경 감지 시 리로드
  useEffect(() => {
    const handleUpdate = () => {
      fetchNotes(true) // 실시간 변경 시에는 기존 데이터를 유지하면서 배경에서 갱신(silent)
    }
    window.addEventListener('notes-updated', handleUpdate)
    return () => window.removeEventListener('notes-updated', handleUpdate)
  }, [fetchNotes])

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
        <NotesListItem key={note.notes_id} note={note} />
      ))}
    </div>
  )
}

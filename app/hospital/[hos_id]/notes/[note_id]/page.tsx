import { createClient } from '@/lib/supabase/server'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import NoteViewClient from './_components/note-view-client'

export default async function NoteDetailPage(props: { params: Promise<{ hos_id: string; note_id: string }> }) {
  const params = await props.params;
  const { hos_id, note_id } = params;
  const supabase = await createClient()

  // Fetch the note with author details
  const { data, error } = await supabase
    .from('notes')
    .select('*, author:users(name, position)')
    .eq('notes_id', note_id)
    .single()

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500 font-bold">노트를 찾을 수 없습니다.</p>
        <Link href={`/hospital/${hos_id}/notes` as any} className="text-blue-500 hover:underline text-sm font-bold">
          노트 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const note = data as NoteWithAuthor

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md border-b p-4 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Link 
            href={`/hospital/${hos_id}/notes` as any} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            title="목록으로"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-black text-slate-800 truncate">{note.title}</h1>
            <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <User size={12} className="text-slate-300" />
                {note.author?.name} <span className="text-slate-300 font-normal">({note.author?.position})</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-300" />
                {format(new Date(note.created_at), 'yyyy-MM-dd HH:mm')}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12">
        <NoteViewClient note={note} hosId={hos_id} />
      </main>
    </div>
  )
}

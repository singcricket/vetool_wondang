'use client'

import { useSearchParams } from 'next/navigation'
import NotesList from '@/components/hospital/notes/notes-body/notes-list/notes-list'
import NotesMainHeader from '@/components/hospital/notes/notes-body/notes-main-header'

export default function NotesPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || null

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-700">
      <NotesMainHeader title="동물병원 노트 공유 허브" selectedCategory={category} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50/50 p-6 lg:p-8">
        <NotesList category={category} />
      </main>
    </div>
  )
}

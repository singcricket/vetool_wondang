'use client'

import { useState } from 'react'
import NotesSearch from '@/components/hospital/notes/notes-body/notes-search'
import NotesMainHeader from '@/components/hospital/notes/notes-body/notes-main-header'

export default function NotesSearchPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-700">
      <NotesMainHeader title="지식 공유 허브" showCreateBtn={false} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50/50 p-6 lg:p-8">
        <NotesSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </main>
    </div>
  )
}

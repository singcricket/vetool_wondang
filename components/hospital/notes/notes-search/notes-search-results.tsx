'use client'

import { NoteWithAuthor } from '@/types/notes/notes_index'
import { BookOpenIcon, CalendarIcon, ChevronRightIcon, SearchIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import NotesViewDialog from '../notes-body/notes-list/notes-view-dialog'

interface Props {
  results: NoteWithAuthor[]
  loading: boolean
  searchTerm: string
}

export default function NotesSearchResults({ results, loading, searchTerm }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-sm">
          <BookOpenIcon size={16} className="text-blue-500" />
          검색 결과 <span className="text-blue-600 font-extrabold ml-1">{results.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : results.length > 0 ? (
          results.map((note) => (
            <NotesViewDialog key={note.notes_id} note={note}>
              <Card 
                className="group flex flex-col md:flex-row hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-slate-100 hover:border-blue-200"
              >
                <CardHeader className="flex-1 p-5 group-hover:bg-blue-50/10 active:bg-blue-50/30 transition-colors">
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter shadow-sm">
                      {note.user_tags?.[0] || '기타'}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <CalendarIcon size={12} strokeWidth={2.5} />
                      {note.created_at ? format(new Date(note.created_at), 'yyyy-MM-dd') : '날짜 없음'}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {note.title}
                  </CardTitle>
                </CardHeader>
                <div className="flex items-center justify-center p-6 border-l border-slate-50 bg-slate-50/50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                   <ChevronRightIcon size={24} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </NotesViewDialog>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <SearchIcon size={48} strokeWidth={1} />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">' {searchTerm} ' 에 대한 검색 결과가 없습니다</h3>
              <p className="text-sm">다른 키워드로 다시 검색해보세요</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

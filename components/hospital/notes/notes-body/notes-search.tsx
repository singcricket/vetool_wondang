'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { searchNotes } from '@/lib/services/notes/notes'
import { Note } from '@/types/notes/notes_index'
import { Input } from '@/components/ui/input'
import { SearchIcon, BookOpenIcon, ClockIcon, FilterIcon, CalendarIcon, ChevronRightIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/utils'

interface Props {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

const recentSearchesPlaceholder = ['임상 증례', '고양이 비만 관리', '술전 처치 매뉴얼', '약품 재고 관리 시트']

export default function NotesSearch({ searchTerm, setSearchTerm }: Props) {
  const { hos_id } = useParams()
  const [results, setResults] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setResults([])
        return
      }
      
      setLoading(true)
      try {
        const fetched = await searchNotes(hos_id as string, searchTerm)
        setResults(fetched)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      if (hos_id) performSearch()
    }, 500)

    return () => clearTimeout(timer)
  }, [hos_id, searchTerm])

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Search Input Bar with Premium Look */}
      <section className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
          <SearchIcon className="h-6 w-6 text-blue-500" />
        </div>
        <Input
          type="text"
          placeholder="제목, 내용, 키워드로 검색해보세요..."
          className="h-16 w-full pl-14 pr-6 rounded-2xl border-2 border-slate-200 bg-white text-lg shadow-xl shadow-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
        <div className="absolute inset-y-0 right-4 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
           <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded border border-slate-200">ENTER</span>
        </div>
      </section>

      {/* Suggested or Recent Search Results */}
      {searchTerm.length < 2 ? (
        <section className="space-y-6">
           <div className="flex items-center gap-2 px-2 text-slate-500 font-bold uppercase tracking-wider text-sm">
             <FilterIcon size={16} />
             추천 검색어
           </div>
           <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
             {recentSearchesPlaceholder.map((tag) => (
               <button 
                 key={tag}
                 onClick={() => setSearchTerm(tag)}
                 className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all active:scale-95"
               >
                 {tag}
               </button>
             ))}
           </div>
        </section>
      ) : (
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
                <Card 
                  key={note.notes_id} 
                  className="group flex flex-col md:flex-row hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-slate-100 hover:border-blue-200"
                >
                  <CardHeader className="flex-1 p-5 group-hover:bg-blue-50/10 active:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter shadow-sm">
                        {note.tags?.[0] || '기타'}
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
      )}
    </div>
  )
}

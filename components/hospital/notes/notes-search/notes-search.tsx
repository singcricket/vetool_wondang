'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { SearchType, searchNotes } from '@/lib/services/notes/notes'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { SearchIcon, FilterIcon } from 'lucide-react'
import NotesSearchResults from './notes-search-results'

interface Props {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

const recentSearchesPlaceholder = ['임상 증례', '직원 교육', '술전 처치 매뉴얼', '약품 재고 관리 시트']

export default function NotesSearch({ searchTerm, setSearchTerm }: Props) {
  const { hos_id } = useParams()
  const [results, setResults] = useState<NoteWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<SearchType>('all')

  const performSearch = async (silent = false) => {
    if (searchTerm.length < 2) {
      setResults([])
      return
    }
    
    if (!silent) setLoading(true)
    try {
      const fetched = await searchNotes(hos_id as string, searchTerm, searchType)
      setResults(fetched)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hos_id) performSearch(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [hos_id, searchTerm, searchType])

  // 실시간 변경 감지 시 리로드
  useEffect(() => {
    const handleUpdate = () => {
      if (searchTerm.length >= 2) {
        performSearch(true)
      }
    }
    window.addEventListener('notes-updated', handleUpdate)
    return () => window.removeEventListener('notes-updated', handleUpdate)
  }, [hos_id, searchTerm, searchType])

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Search Input Bar with Premium Look */}
      <section className="flex items-center gap-3">
        <Select 
          value={searchType} 
          onValueChange={(val: SearchType) => setSearchType(val)}
        >
          <SelectTrigger className="w-[110px] h-16 rounded-2xl border-2 border-slate-200 bg-white text-base shadow-xl shadow-slate-100 font-extrabold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all duration-300">
            <SelectValue placeholder="필터" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
            <SelectItem value="all" className="font-bold py-3">전체</SelectItem>
            <SelectItem value="title" className="font-bold py-3">제목</SelectItem>
            <SelectItem value="content" className="font-bold py-3">내용</SelectItem>
            <SelectItem value="tags" className="font-bold py-3">키워드</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
            <SearchIcon className="h-6 w-6 text-blue-500" />
          </div>
          <Input
            type="text"
            placeholder={
              searchType === 'title' ? '제목으로 검색...' :
              searchType === 'content' ? '내용으로 검색...' :
              searchType === 'tags' ? '키워드로 검색...' :
              '제목, 내용, 키워드로 검색해보세요...'
            }
            className="h-16 w-full pl-14 pr-6 rounded-2xl border-2 border-slate-200 bg-white text-lg shadow-xl shadow-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded border border-slate-200">ENTER</span>
          </div>
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
        <NotesSearchResults 
          results={results} 
          loading={loading} 
          searchTerm={searchTerm} 
        />
      )}
    </div>
  )
}

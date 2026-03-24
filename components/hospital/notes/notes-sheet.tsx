'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpenIcon,
  SearchIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Maximize2Icon,
  TagIcon,
} from 'lucide-react'
import { SearchType, searchNotes } from '@/lib/services/notes/notes'
import {
  getIcuIoKeywords,
  getMsUserTagKeywords,
} from '@/lib/services/notes/notes-sheet-context'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import Autocomplete from '@/components/common/auto-complete/auto-complete'
import NotesViewDialog from '@/components/hospital/notes/notes-body/notes-list/notes-view-dialog'
import NotesEditor from '@/components/hospital/notes/notes-body/notes-create/notes-editor'
import { format } from 'date-fns'

export default function NotesSheet() {
  const { hos_id, patient_id, session_id } = useParams()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('tags')
  const [results, setResults] = useState<NoteWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /** 현재 화면 컨텍스트에서 추출한 키워드 배지 */
  const [contextKeywords, setContextKeywords] = useState<string[]>([])

  // ── 컨텍스트 키워드 로드 ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const load = async () => {
      try {
        // ICU 차트 화면: /icu/[target_date]/chart
        if (pathname?.includes('/icu/') && pathname?.includes('/chart') && patient_id) {
          const kw = await getIcuIoKeywords(patient_id as string)
          setContextKeywords(kw)
          return
        }

        // 모니터링 세션 화면: /monitoring/[target_date]/monitoring-session
        if (pathname?.includes('/monitoring-session') && session_id) {
          const kw = await getMsUserTagKeywords(session_id as string)
          setContextKeywords(kw)
          return
        }
      } catch (e) {
        console.error('context keyword load failed:', e)
      }

      setContextKeywords([])
    }

    load()
  }, [isOpen, pathname, patient_id, session_id])

  // ── 검색 ─────────────────────────────────────────────────────
  const performSearch = useCallback(
    async (silent = false) => {
      if (!hos_id || searchTerm.length < 2) { setResults([]); return }

      const cleaned = searchTerm
        .split(',')
        .map((p) => { const i = p.indexOf('('); return i > -1 ? p.slice(0, i).trim() : p.trim() })
        .filter((p) => p.length > 0)
        .join(',')

      if (!cleaned || cleaned.length < 2) { setResults([]); return }

      if (!silent) setLoading(true)
      try {
        const data = await searchNotes(hos_id as string, cleaned, searchType)
        setResults(data)
      } catch (e) {
        console.error('Notes sheet search failed:', e)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [hos_id, searchTerm, searchType],
  )

  useEffect(() => {
    const timer = setTimeout(() => performSearch(false), 500)
    return () => clearTimeout(timer)
  }, [performSearch])

  useEffect(() => {
    const onUpdate = () => { if (searchTerm.length >= 2) performSearch(true) }
    window.addEventListener('notes-updated', onUpdate)
    return () => window.removeEventListener('notes-updated', onUpdate)
  }, [performSearch, searchTerm])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearchTerm('')
      setResults([])
      setExpandedId(null)
      setContextKeywords([])
    }
  }

  const toggleExpand = (noteId: string) =>
    setExpandedId((prev) => (prev === noteId ? null : noteId))

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="icon" className="mr-1 h-8 w-8 rounded-full 2xl:mr-0" title="노트 빠른 검색">
          <BookOpenIcon size={18} />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[480px] sm:w-[520px] p-0 flex flex-col gap-0">
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-slate-50/70 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base font-black text-slate-900">
            <BookOpenIcon size={16} className="text-blue-500" />
            노트 빠른 검색
          </SheetTitle>

          {/* Search controls */}
          <div className="flex items-center gap-2 mt-2">
            <Select value={searchType} onValueChange={(val: SearchType) => setSearchType(val)}>
              <SelectTrigger className="w-[88px] h-10 rounded-xl border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-blue-100">
                <SelectValue placeholder="필터" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all"     className="font-bold text-xs">전체</SelectItem>
                <SelectItem value="title"   className="font-bold text-xs">제목</SelectItem>
                <SelectItem value="content" className="font-bold text-xs">내용</SelectItem>
                <SelectItem value="tags"    className="font-bold text-xs">키워드</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <SearchIcon size={15} className="text-blue-500" />
              </div>
              <Autocomplete
                defaultValue={searchTerm}
                onInputChange={setSearchTerm}
                placeholder={
                  searchType === 'title'   ? '제목 검색...'   :
                  searchType === 'content' ? '내용 검색...'   :
                  searchType === 'tags'    ? '키워드 검색...' : '검색어 입력...'
                }
                inputClassName="h-10 w-full pl-9 pr-3 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* ── 컨텍스트 키워드 배지 ── */}
          {contextKeywords.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <TagIcon size={10} />
                현재 화면 키워드
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contextKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm(kw)
                      setSearchType('tags')
                    }}
                    title={`'${kw}'로 검색`}
                    className="cursor-pointer text-[11px] font-bold px-2 py-0.5 bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-150 select-none"
                  >
                    #{kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </SheetHeader>

        {/* ── Results ── */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : searchTerm.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <BookOpenIcon size={48} strokeWidth={1} className="text-slate-200" />
                <p className="text-sm font-bold text-slate-500">노트를 검색하세요</p>
                <p className="text-xs text-slate-400">
                  {contextKeywords.length > 0
                    ? '위 키워드 배지를 클릭하거나 직접 입력하세요'
                    : '키워드, 제목 또는 내용으로 찾을 수 있습니다'}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <SearchIcon size={40} strokeWidth={1} className="text-slate-300" />
                <p className="text-sm font-bold text-slate-600">
                  &apos;{searchTerm}&apos;에 대한 결과 없음
                </p>
                <p className="text-xs text-slate-400">다른 키워드로 검색해보세요</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                  <BookOpenIcon size={12} className="text-blue-500" />
                  검색 결과
                  <span className="text-blue-600 font-extrabold">{results.length}</span>건
                </div>

                {results.map((note) => (
                  <div
                    key={note.notes_id}
                    className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
                  >
                    {/* Note item header */}
                    <div className="p-3.5 flex items-start justify-between gap-2">
                      <button
                        className="min-w-0 flex-1 text-left group"
                        onClick={() => toggleExpand(note.notes_id)}
                      >
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                          {note.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarIcon size={10} />
                            {note.created_at
                              ? format(new Date(note.created_at as string), 'yy.MM.dd')
                              : '-'}
                          </span>
                          {note.user_tags && note.user_tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {note.user_tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] font-bold px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-100 pointer-events-none"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                              {note.user_tags.length > 3 && (
                                <span className="text-[10px]">+{note.user_tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        {/* 전체화면 보기 */}
                        <NotesViewDialog note={note}>
                          <button
                            title="전체화면으로 보기"
                            className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Maximize2Icon size={14} />
                          </button>
                        </NotesViewDialog>

                        {/* 펼치기/접기 */}
                        <button
                          onClick={() => toggleExpand(note.notes_id)}
                          title="내용 펼치기"
                          className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          {expandedId === note.notes_id
                            ? <ChevronDownIcon size={16} />
                            : <ChevronRightIcon size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* 펼쳐진 본문 */}
                    {expandedId === note.notes_id && (
                      <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                        {note.user_tags && note.user_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 px-3.5 pt-3">
                            {note.user_tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] font-bold px-1.5 py-0.5 bg-white text-blue-600 border-blue-100"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="overflow-y-auto overflow-x-auto max-h-[400px] bg-white mt-1">
                          <NotesEditor
                            content={note.content}
                            hosId={note.hos_id}
                            editable={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

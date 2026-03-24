'use client'

/**
 * NotesRelatedPanel
 *
 * 재사용 가능한 연관 노트 패널 컴포넌트입니다.
 * 지정된 태그(tag)로 notes 테이블의 tags 컬럼을 검색하여
 * 일치하는 노트 목록을 슬라이드 패널 형태로 표시합니다.
 *
 * @example
 * // NotesViewDialog 내 분할 뷰
 * <NotesRelatedPanel
 *   hosId={hosId}
 *   tag="당뇨"
 *   currentNoteId={note.notes_id}
 *   onClose={() => setActiveTag(null)}
 * />
 *
 * @example
 * // 다른 컴포넌트에서도 재사용 가능
 * <NotesRelatedPanel hosId={hosId} tag={selectedTag} onClose={handleClose} />
 */

import { useState, useEffect } from 'react'
import { getNotesByTag } from '@/lib/services/notes/notes'
import { NoteWithAuthor } from '@/types/notes/notes_index'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  XIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
  CalendarIcon,
  HashIcon,
  Maximize2Icon,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/utils'
import NotesEditor from '../notes-body/notes-create/notes-editor'

interface Props {
  /** 병원 ID */
  hosId: string
  /** 검색에 사용할 태그 */
  tag: string
  /** 현재 열람 중인 노트 ID - 목록에서 제외됨 */
  currentNoteId?: string
  /** 패널 닫기 콜백 */
  onClose: () => void
  /**
   * 노트를 메인 뷰에 표시하도록 부모에게 알리는 콜백.
   * 제공되지 않으면 확대 버튼이 렌더링되지 않습니다.
   */
  onSelectNote?: (note: NoteWithAuthor) => void
}

export default function NotesRelatedPanel({ hosId, tag, currentNoteId, onClose, onSelectNote }: Props) {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!tag) return

    const fetchRelated = async () => {
      setLoading(true)
      setExpandedId(null)
      try {
        const result = await getNotesByTag(hosId, tag)
        // 현재 열람 중인 노트는 목록에서 제외
        setNotes(result.filter((n) => n.notes_id !== currentNoteId))
      } catch (e) {
        console.error('연관 노트 검색 실패:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchRelated()
  }, [hosId, tag, currentNoteId])

  const toggleExpand = (noteId: string) => {
    setExpandedId((prev) => (prev === noteId ? null : noteId))
  }

  return (
    <div className="flex flex-col h-full border-l border-slate-200 bg-slate-50/50 animate-in slide-in-from-right-6 duration-300 overflow-x-auto">
      {/* Panel Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <TagIcon size={11} />
            연관 노트
          </div>
          <div className="flex items-center gap-2">
            <HashIcon size={14} className="text-blue-500 shrink-0" />
            <span className="font-black text-slate-900 text-base leading-tight break-all">
              {tag}
            </span>
          </div>
          {!loading && (
            <span className="text-xs text-slate-500">
              {notes.length > 0 ? `${notes.length}개 문서 발견` : '관련 문서 없음'}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 mt-0.5"
          onClick={onClose}
          title="패널 닫기"
        >
          <XIcon size={14} />
        </Button>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <BookOpenIcon size={36} strokeWidth={1} className="text-slate-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-600">관련 노트가 없습니다</p>
                <p className="text-xs text-slate-400">
                  &#39;{tag}&#39; 태그로 작성된<br />다른 노트가 없습니다
                </p>
              </div>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.notes_id}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
              >
                {/* Note Item Header */}
                <div className="p-3.5 flex items-start justify-between gap-2">
                  {/* Clickable title area → expand/collapse */}
                  <button
                    className="min-w-0 flex-1 text-left group"
                    onClick={() => toggleExpand(note.notes_id)}
                  >
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                      {note.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={10} />
                        {note.created_at
                          ? format(new Date(note.created_at as string), 'yy.MM.dd')
                          : '-'}
                      </span>
                      {note.user_tags && note.user_tags.length > 0 && (
                        <span className="flex items-center gap-1 flex-wrap">
                          {note.user_tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className={cn(
                                'px-1.5 py-0.5 rounded font-bold',
                                t === tag
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-slate-100 text-slate-500',
                              )}
                            >
                              #{t}
                            </span>
                          ))}
                          {note.user_tags.length > 2 && (
                            <span className="text-slate-400">+{note.user_tags.length - 2}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Right action icons */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {/* Maximize: 메인 뷰 교체 */}
                    {onSelectNote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNote(note)
                        }}
                        title="메인 화면에서 열기"
                        className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Maximize2Icon size={14} />
                      </button>
                    )}
                    {/* Expand/Collapse chevron */}
                    <button
                      onClick={() => toggleExpand(note.notes_id)}
                      title="내용 펼치기"
                      className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {expandedId === note.notes_id ? (
                        <ChevronDownIcon size={16} />
                      ) : (
                        <ChevronRightIcon size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Preview */}
                {expandedId === note.notes_id && (
                  <div className="border-t border-slate-100 bg-slate-50/60 animate-in slide-in-from-top-2 duration-200">
                    {/* Tag badges */}
                    {note.user_tags && note.user_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-3.5 pt-3">
                        {note.user_tags.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5',
                              t === tag
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-white text-slate-500 border-slate-200',
                            )}
                          >
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Full Note Content - scrollable */}
                    <div className="overflow-y-auto overflow-x-auto max-h-[360px] border-t border-slate-100 mt-2 bg-white">
                      <NotesEditor
                        content={note.content}
                        hosId={hosId}
                        editable={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

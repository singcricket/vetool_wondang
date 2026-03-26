import { createAdminClient } from '@/lib/supabase/admin'
import NotesEditor from '@/components/hospital/notes/notes-body/notes-create/notes-editor'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, UserIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { NoteWithAuthor } from '@/types/notes/notes_index'

interface Props {
  resourceId: string
  restrictedData?: Record<string, boolean> | null
}

export default async function SharedNoteView({ resourceId, restrictedData }: Props) {
  try {
    const supabase = createAdminClient()

    // 1. Fetch note data
    const { data: note, error } = await supabase
      .from('notes')
      .select(`
        *,
        author:users(name, position)
      `)
      .eq('notes_id', resourceId)
      .single()

    if (error || !note) {
      return (
        <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
          <span className="font-bold text-red-500">노트 데이터를 불러올 수 없습니다.</span>
          <span className="text-xs break-all">디바깅 에러: {error ? error.message : '알 수 없는 오류 (데이터 없음)'}</span>
        </div>
      )
    }

    const typedNote = note as unknown as NoteWithAuthor

    // Safe date formatting
    let formattedDate = '-'
    if (typedNote.created_at) {
      try {
        const dateObj = new Date(typedNote.created_at)
        if (!isNaN(dateObj.getTime())) {
          formattedDate = format(dateObj, 'yyyy년 MM월 dd일 HH:mm')
        }
      } catch (e) {
        console.error('Date formatting error:', e)
      }
    }

    return (
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Header Info */}
        <div className="p-6 md:p-8 flex flex-col gap-6 border-b bg-slate-50/50">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
            {typedNote.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-slate-400" />
              <span className="font-semibold text-slate-700">{typedNote.author?.name || '알 수 없음'}</span>
              <span className="text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full text-xs">
                {typedNote.author?.position || '수의사'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CalendarIcon size={16} className="text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {typedNote.tags && typedNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {typedNote.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Note Content Editor (Read-Only) */}
        <div className="p-4 md:p-8 min-h-[500px] prose-container">
          <NotesEditor
            content={typedNote.content}
            hosId={typedNote.hos_id}
            editable={false}
          />
        </div>
      </div>
    )
  } catch (e: any) {
    console.error('SharedNoteView Error:', e)
    return (
      <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
        <span className="font-bold text-red-500">노트를 렌더링하는 중 오류가 발생했습니다.</span>
        <span className="text-xs">상세 내용: {e.message || '알 수 없는 서버 오류'}</span>
      </div>
    )
  }
}


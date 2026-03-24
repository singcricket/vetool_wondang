'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createNote, updateNote, getNoteCategories, getNoteById } from '@/lib/services/notes/notes'
import { 
  ChevronLeftIcon, 
  UserIcon, 
  HashIcon, 
  ClipboardListIcon,
  CloudUploadIcon
} from 'lucide-react'
import NotesEditor from './notes-editor'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/utils'
import { NoteCategoryNode, NotesCategoryConfig } from '@/types/notes/notes_index'
import NotesTagInput from './notes-tag-input'
import NotesCategorySelect from './notes-category-select'

interface UserData {
  user_id: string
  name: string
  position: string
}

interface Props {
  isDialog?: boolean
  onDone?: () => void
  onCancel?: () => void
  editNoteId?: string | null
  copyNoteId?: string | null
  defaultCategory?: string | null
}

export default function NotesCreateForm({ isDialog = false, onDone, onCancel, editNoteId, copyNoteId, defaultCategory }: Props) {
  const router = useRouter()
  const { hos_id } = useParams()
  const supabase = createClient()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<any>(null)
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('')
  const [userTags, setUserTags] = useState<string[]>([])
  const [hospitalUsers, setHospitalUsers] = useState<UserData[]>([])
  const [dbCategories, setDbCategories] = useState<NotesCategoryConfig>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!hos_id) return
      setIsLoading(true)

      try {
        // Fetch Categories and Users
        const [catData, { data: usersData, error: usersError }] = await Promise.all([
          getNoteCategories(hos_id as string),
          supabase
            .from('users')
            .select('user_id, name, position')
            .eq('hos_id', hos_id as string)
            .order('name', { ascending: true })
        ])

        setDbCategories(catData)
        if (usersError) throw usersError
        setHospitalUsers(usersData || [])

        // Fetch data based on ID (Edit or Copy)
        const targetId = editNoteId || copyNoteId
        
        if (targetId) {
          const existingNote = await getNoteById(targetId)
          if (existingNote) {
            setTitle(editNoteId ? existingNote.title : `${existingNote.title} (복사본)`)
            setContent(existingNote.content)
            setUserTags(existingNote.user_tags || [])
            
            // For Copying: default to current user
            if (copyNoteId) {
              const { data: { user } } = await supabase.auth.getUser()
              if (user) setSelectedAuthorId(user.id)
            } else {
              // For Editing: use the original author if possible
              setSelectedAuthorId(existingNote.user_id || '')
            }
          }
        } else {
          // New Note: set default author and category if provided
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setSelectedAuthorId(user.id)
          }

          if (defaultCategory) {
            setUserTags([defaultCategory])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('데이터를 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [hos_id, supabase, editNoteId, copyNoteId])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요')
      return
    }
    if (!selectedAuthorId) {
      toast.error('작성자를 선택해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const finalUserTags = userTags.filter(tag => tag && tag.trim() !== '')

      if (editNoteId) {
        await updateNote(editNoteId, {
          title,
          user_id: selectedAuthorId,
          user_tags: finalUserTags,
          content: content,
        })
        toast.success('지식 문서가 수정되었습니다')
      } else {
        await createNote({
          hos_id: hos_id as string,
          user_id: selectedAuthorId,
          title,
          tags: [], 
          user_tags: finalUserTags,
          content: content,
          is_shared: false
        })
        toast.success('지식 문서가 발행되었습니다')
      }
      
      // 실시간 업데이트 이벤트 발생 (즉각적인 목록 갱신 유도)
      window.dispatchEvent(new CustomEvent('notes-updated'))

      if (isDialog && onDone) {
        onDone()
      } else {
        router.push(`/hospital/${hos_id}/notes`)
        // router.refresh()
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      toast.error('저장 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const flattenCategories = (nodes: NoteCategoryNode[], depth = 0): { label: string, depth: number }[] => {
    let flat: { label: string, depth: number }[] = []
    nodes.forEach(node => {
      if (node.label !== '전체 보기') {
         flat.push({ label: node.label, depth })
      }
      if (node.children) {
        flat = [...flat, ...flattenCategories(node.children, depth + 1)]
      }
    })
    return flat
  }

  const flatCategories = flattenCategories(dbCategories)

  const toggleCategory = (category: string) => {
    if (userTags.includes(category)) {
      setUserTags(userTags.filter(t => t !== category))
    } else {
      setUserTags([...userTags, category])
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (isDialog && onDone) {
      onDone()
    } else {
      router.back()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Action Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b shrink-0 bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2">
            {!isDialog && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={handleCancel}>
                  <ChevronLeftIcon size={18} />
              </Button>
            )}
            <h2 className="text-[10px] sm:text-sm font-bold text-slate-700 uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
               {editNoteId ? "수정" : (copyNoteId ? "복사" : (isDialog ? "팝업 작성" : "작성"))}
               <span className="hidden sm:inline"> {editNoteId ? "지식 문서 수정" : (copyNoteId ? "지식 문서 복사" : (isDialog ? "새 지식 문서 팝업 작성" : "새 지식 문서 작성"))}</span>
            </h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-slate-600" onClick={handleCancel}>
                취소
            </Button>
            <Button 
              size="sm" 
              className="px-2 sm:px-4 py-2 font-bold text-[10px] sm:text-sm" 
              disabled={isSubmitting || isLoading} 
              onClick={handleSave}
            >
                <CloudUploadIcon size={14} className="sm:mr-2" />
                <span className="hidden sm:inline">{isSubmitting ? '저장 중...' : (editNoteId ? '수정 완료' : '문서 발행')}</span>
                <span className="inline sm:hidden">{isSubmitting ? '...' : (editNoteId ? '저장' : '발행')}</span>
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
          
          {/* Metadata Row */}
          <div className="flex flex-wrap gap-2">
            
            {/* Title */}
            <div className="w-full sm:w-[calc(40%-0.5rem)] relative flex items-center h-10">
              <Label className="absolute left-3 text-slate-400 z-10 pointer-events-none w-4 h-4 flex items-center justify-center" htmlFor="note-title">
                <ClipboardListIcon size={14} />
              </Label>
              <Input
                id="note-title"
                placeholder="지식 문서 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="pl-10 h-10 w-full border-slate-200 focus-visible:ring-slate-300 shadow-none font-bold text-xs sm:text-sm"
              />
            </div>

            {/* Author */}
            <div className="w-full sm:w-[calc(30%-0.5rem)] relative flex items-center h-10">
              <Label className="absolute left-3 text-slate-400 z-10 pointer-events-none w-4 h-4 flex items-center justify-center">
                <UserIcon size={14} />
              </Label>
              <Select onValueChange={setSelectedAuthorId} value={selectedAuthorId}>
                <SelectTrigger className="pl-10 h-10 w-full border-slate-200 hover:border-slate-300 transition-colors shadow-none font-medium text-[10px] sm:text-xs">
                  <SelectValue placeholder="작성자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {hospitalUsers.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                       {user.name} ({user.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category selection */}
            <div className="w-full sm:w-[calc(30%-0.5rem)]">
               <NotesCategorySelect 
                  flatCategories={flatCategories} 
                  userTags={userTags} 
                  onToggleCategory={toggleCategory} 
               />
            </div>

            {/* Tags row */}
            <div className="w-full flex items-center gap-2 p-1 bg-slate-50/50 rounded-md border border-slate-200 shadow-sm min-h-12 transition-all">
               <div className="flex items-center gap-2 px-4 border-r border-slate-200 pr-5 h-8">
                  <HashIcon size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tags</span>
               </div>
               
               <div className="flex-1">
                  <NotesTagInput userTags={userTags} onChange={setUserTags} />
               </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-100 mt-2">
            <NotesEditor 
               content={content} 
               onChange={setContent} 
               hosId={hos_id as string}
            />
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}

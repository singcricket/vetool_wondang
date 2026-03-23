'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createNote, getNoteCategories } from '@/lib/services/notes/notes'
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

export default function NotesCreateForm() {
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
        const catData = await getNoteCategories(hos_id as string)
        setDbCategories(catData)

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('user_id, name, position')
          .eq('hos_id', hos_id as string)
          .order('name', { ascending: true })

        if (usersError) throw usersError
        setHospitalUsers(usersData || [])

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setSelectedAuthorId(user.id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [hos_id, supabase])

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

      await createNote({
        hos_id: hos_id as string,
        user_id: selectedAuthorId,
        title,
        tags: [], 
        user_tags: finalUserTags,
        content: content,
        is_shared: true
      })
      toast.success('지식 문서가 발행되었습니다')
      router.push(`/hospital/${hos_id}/notes`)
      router.refresh()
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('발행 중 오류가 발생했습니다')
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

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Action Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b shrink-0 bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => router.back()}>
                <ChevronLeftIcon size={18} />
            </Button>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">새 지식 문서 작성</h2>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-slate-400 hover:text-slate-600" onClick={() => router.back()}>
                취소
            </Button>
            <Button 
              size="sm" 
              className="px-4 py-2 font-bold" 
              disabled={isSubmitting || isLoading} 
              onClick={handleSave}
            >
                <CloudUploadIcon size={16} className="mr-2" />
                {isSubmitting ? '발행 중...' : '지식 문서 발행'}
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
          
          {/* Metadata Row */}
          <div className="flex flex-wrap gap-2">
            
            {/* Title - Increased Padding (pl-14) */}
            <div className="w-full md:w-[calc(40%-0.5rem)] relative flex items-center h-10">
              <Label className="absolute left-4 text-slate-400 z-10 pointer-events-none w-5 h-5 flex items-center justify-center" htmlFor="note-title">
                <ClipboardListIcon size={16} />
              </Label>
              <Input
                id="note-title"
                placeholder="지식 문서 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="pl-14 h-10 w-full border-slate-200 focus-visible:ring-slate-300 shadow-none font-bold"
              />
            </div>

            {/* Author - Increased Padding (pl-14) */}
            <div className="w-full md:w-[calc(30%-0.5rem)] relative flex items-center h-10">
              <Label className="absolute left-4 text-slate-400 z-10 pointer-events-none w-5 h-5 flex items-center justify-center">
                <UserIcon size={16} />
              </Label>
              <Select onValueChange={setSelectedAuthorId} value={selectedAuthorId}>
                <SelectTrigger className="pl-14 h-10 w-full border-slate-200 hover:border-slate-300 transition-colors shadow-none font-medium">
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

            {/* Category selection (Separated Component) */}
            <div className="w-full md:w-[calc(30%-0.5rem)]">
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

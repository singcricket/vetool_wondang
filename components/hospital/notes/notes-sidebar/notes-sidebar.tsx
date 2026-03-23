'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/utils'
import { HashIcon, SettingsIcon, ChevronRightIcon, PlusIcon, Trash2Icon, FolderIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter, useSearchParams } from 'next/navigation'
import { getNoteCategories, updateNoteCategories } from '@/lib/services/notes/notes'
import { NotesCategoryConfig, NoteCategoryNode } from '@/types/notes/notes_index'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Props {
  hosId: string
}

export default function NotesSidebar({ hosId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category') || null
  
  const [categories, setCategories] = useState<NotesCategoryConfig>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getNoteCategories(hosId)
        setCategories(data)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategories()
  }, [hosId])

  const handleSelectCategory = (category: string | null) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    router.push(`/hospital/${hosId}/notes?${params.toString()}`)
  }

  // Recursive category rendering
  const renderCategory = (node: NoteCategoryNode, depth = 0) => {
    const isActive = selectedCategory === node.label
    
    return (
      <div key={node.id} className="space-y-1">
        <button
          onClick={() => handleSelectCategory(node.label === '전체 보기' ? null : node.label)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all group',
            isActive || (selectedCategory === null && node.label === '전체 보기')
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            depth > 0 && 'ml-4'
          )}
        >
          <HashIcon size={12} className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-600'
          )} />
          <span className="truncate">{node.label}</span>
          {node.children && node.children.length > 0 && (
            <ChevronRightIcon size={10} className={cn("ml-auto", isActive? "text-white/70" : "text-slate-300")} />
          )}
        </button>
        {node.children?.map(child => renderCategory(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="fixed left-0 2xl:left-10 hidden h-full w-56 flex-col border-r bg-white 2xl:flex overflow-y-auto outline-none">
      {/* Category Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b shrink-0 bg-background sticky top-0 z-10">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Category</h2>
        
        <CategorySettingsDialog 
          hosId={hosId} 
          categories={categories} 
          onSave={setCategories} 
        />
      </div>

      {/* Category List */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-1 px-3 pb-20">
          {isLoading ? (
             <div className="animate-pulse space-y-4 px-2">
                {[1, 2, 3, 4].map(i => (
                   <div key={i} className="h-6 bg-slate-100 rounded" />
                ))}
             </div>
          ) : (
            categories.map(cat => renderCategory(cat))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Category Management Dialog
function CategorySettingsDialog({ 
  hosId, 
  categories, 
  onSave 
}: { 
  hosId: string, 
  categories: NotesCategoryConfig,
  onSave: (cats: NotesCategoryConfig) => void 
}) {
  const [editingCats, setEditingCats] = useState<NotesCategoryConfig>([])
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setEditingCats(JSON.parse(JSON.stringify(categories)))
    }
  }, [open, categories])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateNoteCategories(hosId, editingCats)
      onSave(editingCats)
      toast.success('카테고리가 저장되었습니다')
      setOpen(false)
    } catch (error) {
      toast.error('저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const addCategory = (parentId?: string) => {
    const newCat: NoteCategoryNode = {
      id: crypto.randomUUID(),
      label: '새 카테고리',
      children: []
    }

    if (!parentId) {
      setEditingCats([...editingCats, newCat])
    } else {
      const updateChildren = (items: NoteCategoryNode[]): NoteCategoryNode[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), newCat] }
          }
          if (item.children) {
            return { ...item, children: updateChildren(item.children) }
          }
          return item
        })
      }
      setEditingCats(updateChildren(editingCats))
    }
  }

  const removeCategory = (id: string) => {
    const filterOut = (items: NoteCategoryNode[]): NoteCategoryNode[] => {
      return items.filter(item => item.id !== id).map(item => ({
        ...item,
        children: item.children ? filterOut(item.children) : []
      }))
    }
    setEditingCats(filterOut(editingCats))
  }

  const updateLabel = (id: string, label: string) => {
    const update = (items: NoteCategoryNode[]): NoteCategoryNode[] => {
      return items.map(item => {
        if (item.id === id) return { ...item, label }
        if (item.children) return { ...item, children: update(item.children) }
        return item
      })
    }
    setEditingCats(update(editingCats))
  }

  const renderEditableCategory = (node: NoteCategoryNode, depth = 0) => (
    <div key={node.id} className="space-y-2 mb-2">
      <div className={cn("flex items-center gap-2", depth > 0 && "ml-4 pl-2 border-l border-slate-200")}>
        <FolderIcon size={14} className="text-slate-400" />
        <Input 
          value={node.label} 
          onChange={(e) => updateLabel(node.id, e.target.value)}
          className="h-8 text-[11px] font-medium"
        />
        {depth < 1 && (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-500" onClick={() => addCategory(node.id)}>
            <PlusIcon size={14} />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-300 hover:text-red-500" onClick={() => removeCategory(node.id)}>
          <Trash2Icon size={14} />
        </Button>
      </div>
      {node.children?.map(child => renderEditableCategory(child, depth + 1))}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-500 transition-colors">
          <SettingsIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-black uppercase">Manage Categories</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            {editingCats.map(cat => renderEditableCategory(cat))}
            <Button 
                variant="outline" 
                className="w-full mt-4 border-dashed py-6 gap-2 text-xs font-bold text-slate-500"
                onClick={() => addCategory()}
            >
              <PlusIcon size={14} />
              메인 카테고리 추가
            </Button>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs font-bold">취소</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-bold h-8 text-xs px-6 rounded-md" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Folder, Loader2, Check, FolderPlus } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Collection } from '@/types/collections/collection-type'
import { ShareResourceType } from '@/types/share/share-type'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  hosId: string
  userId: string
  resourceType: ShareResourceType
  resourceId: string
  resourceTitle?: string
}

export default function AddToCollectionDialog({
  isOpen,
  onOpenChange,
  hosId,
  userId,
  resourceType,
  resourceId,
  resourceTitle,
}: Props) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [selectedColId, setSelectedColId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('resource_collections')
        .select('*')
        .eq('hos_id', hosId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCollections(data as Collection[])
    } catch (e) {
      console.error(e)
      toast.error('컬렉션 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCollection = async () => {
    if (!newTitle.trim()) return
    setIsCreating(true)
    try {
      const { data, error } = await (supabase as any)
        .from('resource_collections')
        .insert({
          hos_id: hosId,
          user_id: userId,
          title: newTitle.trim(),
        })
        .select()
        .single()

      if (error) throw error
      setCollections([data as Collection, ...collections])
      setNewTitle('')
      setIsCreating(false)
      toast.success('새 컬렉션이 생성되었습니다.')
    } catch (e) {
      console.error(e)
      toast.error('컬렉션 생성에 실패했습니다.')
      setIsCreating(false)
    }
  }

  const handleAddToCollection = async () => {
    if (!selectedColId) return
    setIsAdding(true)
    try {
      // 1. Get max order index
      const { data: currentItems } = await (supabase as any)
        .from('resource_collection_items')
        .select('order_index')
        .eq('collection_id', selectedColId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextIndex = currentItems && currentItems.length > 0 ? currentItems[0].order_index + 1 : 0

      // 2. Insert item
      const { error } = await (supabase as any)
        .from('resource_collection_items')
        .insert({
          collection_id: selectedColId,
          resource_type: resourceType,
          resource_id: resourceId,
          order_index: nextIndex,
        })


      if (error) {
        if (error.code === '23505') {
          toast.error('이미 컬렉션에 포함된 항목입니다.')
        } else {
          throw error
        }
      } else {
        toast.success('컬렉션에 추가되었습니다.')
        onOpenChange(false)
      }
    } catch (e) {
      console.error(e)
      toast.error('컬렉션 추가에 실패했습니다.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl z-[200]">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <FolderPlus className="text-blue-400" />
            컬렉션에 추가
          </DialogTitle>
          <p className="text-slate-400 text-xs mt-1">
            선택한 리소스를 보관할 컬렉션을 선택하거나 새로 만드세요.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-white">
          {/* Create New */}
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="새 컬렉션 이름..."
              className="flex-1 h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
            />
            <Button 
              size="sm" 
              onClick={handleCreateCollection} 
              disabled={isCreating || !newTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : collections.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm italic">
                생성된 컬렉션이 없습니다.
              </div>
            ) : (
              collections.map((col) => (
                <button
                  key={col.collection_id}
                  onClick={() => setSelectedColId(col.collection_id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                    selectedColId === col.collection_id
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "hover:bg-slate-50 border-transparent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    selectedColId === col.collection_id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <Folder size={16} />
                  </div>
                  <span className={cn(
                    "flex-1 text-sm font-bold truncate",
                    selectedColId === col.collection_id ? "text-slate-900" : "text-slate-600"
                  )}>
                    {col.title}
                  </span>
                  {selectedColId === col.collection_id && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t flex gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
            취소
          </Button>
          <Button 
            onClick={handleAddToCollection} 
            disabled={!selectedColId || isAdding}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : '추가하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

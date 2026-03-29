'use client'

import { useState } from 'react'
import { FolderPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createCollection } from '@/lib/services/collections/collections'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  hosId: string
  userId: string
}

export default function CreateCollectionButton({ hosId, userId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }

    setIsCreating(true)
    try {
      const data = await createCollection({
        hos_id: hosId,
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
      })
      toast.success('새 컬렉션이 생성되었습니다.')
      setIsOpen(false)
      setTitle('')
      setDescription('')
      
      // Navigate to the newly created collection page
      router.push(`/hospital/${hosId}/collections/${data.collection_id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('컬렉션 생성 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 font-bold gap-2"
      >
        <FolderPlus size={18} />
        새 컬렉션
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FolderPlus size={20} className="text-blue-400" />
              새 컬렉션 만들기
            </DialogTitle>
            <p className="text-slate-400 text-xs mt-1">
              연구, 발표, 혹은 관심 있는 사례별로 기록을 한 곳에 모아보세요.
            </p>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                  컬렉션 제목
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="컬렉션 제목을 입력하세요 (예: 췌장염 사례 모음)..."
                  className="w-full h-11 px-4 text-sm font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                  컬렉션 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="컬렉션에 대한 설명을 간단히 입력하세요 (선택 사항)..."
                  rows={3}
                  className="w-full p-4 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t flex gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 font-bold">
              취소
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !title.trim()}
              className="flex-1 bg-slate-900 hover:bg-slate-800 font-bold"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              컬렉션 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

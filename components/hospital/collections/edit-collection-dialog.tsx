'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  updateCollection, 
  deleteCollection 
} from '@/lib/services/collections/collections'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  collection: any
  hosId: string
}

export default function EditCollectionDialog({
  isOpen,
  onOpenChange,
  collection,
  hosId,
}: Props) {
  const [title, setTitle] = useState(collection.title)
  const [description, setDescription] = useState(collection.description || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    setIsUpdating(true)
    try {
      await updateCollection(collection.collection_id, {
        title: title.trim(),
        description: description.trim(),
      })
      toast.success('컬렉션 설정이 업데이트되었습니다.')
      onOpenChange(false)
      router.refresh()
    } catch (e) {
      console.error(e)
      toast.error('업데이트에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCollection(collection.collection_id)
      toast.success('컬렉션이 삭제되었습니다.')
      onOpenChange(false)
      router.push(`/hospital/${hosId}/collections`)
    } catch (e) {
      console.error(e)
      toast.error('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Settings className="text-blue-400 w-5 h-5" />
              컬렉션 설정 변경
            </DialogTitle>
            <p className="text-slate-400 text-xs mt-1">
              컬렉션의 이름과 설명을 수정하거나 삭제할 수 있습니다.
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
                  placeholder="컬렉션 제목을 입력하세요..."
                  className="w-full h-11 px-4 text-sm font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                  컬렉션 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="설명을 입력하세요 (선택 사항)..."
                  rows={3}
                  className="w-full p-4 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t flex items-center gap-2">
            {/* 삭제 버튼을 푸터 왼쪽(중앙 버튼 옆)으로 이동 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 shrink-0"
              title="컬렉션 삭제"
            >
              <Trash2 size={18} />
            </Button>
            
            <div className="flex-1 flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 font-bold h-10">
                취소
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={isUpdating || !title.trim()}
                className="flex-[2] bg-slate-900 hover:bg-slate-800 font-bold h-10"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                저장하기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">정말로 컬렉션을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2">
              이 작업은 복구할 수 없습니다. 컬렉션 이름과 설정이 삭제됩니다. (원본 데이터는 유지됩니다)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel className="font-bold rounded-xl border-2 flex-1">취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 font-bold rounded-xl flex-1"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              네, 삭제하겠습니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Settings, Share2, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import EditCollectionDialog from '@/components/hospital/collections/edit-collection-dialog'
import ShareResourceDialog from '@/components/hospital/share/share-resource-dialog'
import { createClient } from '@/lib/supabase/client'
import { deleteCollection } from '@/lib/services/collections/collections'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
  collection: any
  hosId: string
}

export default function CollectionHeader({ collection, hosId }: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCollection(collection.collection_id)
      toast.success('컬렉션이 삭제되었습니다.')
      router.push(`/hospital/${hosId}/collections`)
    } catch (e) {
      console.error(e)
      toast.error('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <header className="flex flex-col gap-4">
      <Link 
        href={`/hospital/${hosId}/collections`} 
        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        목록으로 돌아가기
      </Link>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{collection.title}</h1>
          <p className="text-slate-500 text-sm">{collection.description || '컬렉션에 대한 설명이 없습니다.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="font-bold border-2 gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 size={18} />
            공유하기
          </Button>
          
          {/* 설정 변경 버튼 왼쪽(공유 버튼 오른쪽)에 삭제 버튼 추가 */}
          <Button 
            variant="outline" 
            className="font-bold border-2 gap-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors px-3"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 size={18} />
          </Button>

          <Button 
            variant="outline" 
            className="font-bold border-2 gap-2"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Settings size={18} />
            설정 변경
          </Button>
        </div>
      </div>

      <EditCollectionDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collection}
        hosId={hosId}
      />

      <ShareResourceDialog
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        resourceType="collection"
        resourceId={collection.collection_id}
        title={collection.title}
        hosId={hosId}
        userId={userId || undefined}
      />

      {/* 컬렉션 삭게 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
    </header>
  )
}

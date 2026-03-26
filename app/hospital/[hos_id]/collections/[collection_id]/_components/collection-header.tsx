'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Settings, Share2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import EditCollectionDialog from '@/components/hospital/collections/edit-collection-dialog'
import ShareResourceDialog from '@/components/hospital/share/share-resource-dialog'
import { createClient } from '@/lib/supabase/client'

interface Props {
  collection: any
  hosId: string
}

export default function CollectionHeader({ collection, hosId }: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

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
    </header>
  )
}

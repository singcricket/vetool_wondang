'use client'

import { useState } from 'react'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import EditCollectionDialog from '@/components/hospital/collections/edit-collection-dialog'

interface Props {
  collection: any
  hosId: string
}

export default function CollectionHeader({ collection, hosId }: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
        <Button 
          variant="outline" 
          className="font-bold border-2 gap-2"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Settings size={18} />
          설정 변경
        </Button>
      </div>

      <EditCollectionDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collection}
        hosId={hosId}
      />
    </header>
  )
}

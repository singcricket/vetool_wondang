'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2Icon } from 'lucide-react'
import ShareResourceDialog from '@/components/hospital/share/share-resource-dialog'

interface Props {
  sessionId: string
  title: string
  hosId: string
}

export default function MsShareButton({ sessionId, title, hosId }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        title="이 세션 링크로 외부 공유하기"
      >
        <Share2Icon size={18} />
      </Button>
      
      <ShareResourceDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        resourceType="monitoring"
        resourceId={sessionId}
        title={title}
        hosId={hosId}
      />
    </>
  )
}

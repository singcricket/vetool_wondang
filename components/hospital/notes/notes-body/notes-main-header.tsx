'use client'

import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface Props {
  title: string
  selectedCategory?: string | null
  showCreateBtn?: boolean
}

export default function NotesMainHeader({ 
  title, 
  selectedCategory, 
  showCreateBtn = true 
}: Props) {
  const router = useRouter()
  const { hos_id } = useParams()

  return (
    <header className="flex h-12 items-center justify-between px-4 border-b bg-background shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        {selectedCategory && (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50">
            {selectedCategory}
          </Badge>
        )}
      </div>

      {showCreateBtn && (
        <Button 
          size="sm"
          className="flex items-center gap-2 pr-4 text-sm font-bold"
          onClick={() => router.push(`/hospital/${hos_id}/notes/new`)}
        >
          <PlusIcon size={18} />
          <span>새 노트 작성</span>
        </Button>
      )}
    </header>
  )
}

'use client'

import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import NotesCreateDialog from './notes-create/notes-create-dialog'

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
  const { hos_id } = useParams()

  return (
    <header className="flex h-12 items-center justify-between px-4 pl-14 2xl:pl-4 border-b bg-background sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        {selectedCategory && (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50">
            {selectedCategory}
          </Badge>
        )}
      </div>

      {showCreateBtn && (
        <NotesCreateDialog defaultCategory={selectedCategory} />
      )}
    </header>
  )
}

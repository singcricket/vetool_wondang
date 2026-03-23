'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { ListIcon, SearchIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import useNotesRealtime from '@/hooks/use-notes-realtime'

interface Props {
  hosId: string
}

export default function NotesFooter({ hosId }: Props) {
  useNotesRealtime(hosId)
  const router = useRouter()
  const pathname = usePathname()
  
  // Determine if we're on the list page or search page
  const isSearchPage = pathname.endsWith('/search')
  const isListPage = !isSearchPage && !pathname.includes('/new') && !pathname.includes('/edit')

  return (
    <footer className="fixed bottom-0 left-0 2xl:left-64 right-0 z-40 flex h-10 border-t bg-white items-center justify-start px-4 shadow-sm">
      <ul className="flex h-full items-center gap-2">
        <li>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              isListPage ? 'bg-muted text-slate-900 font-bold' : 'text-slate-500',
              'flex items-center gap-2 min-w-[100px]',
            )}
            onClick={() => router.push(`/hospital/${hosId}/notes`)}
          >
            <ListIcon size={16} />
            노트목록
          </Button>
        </li>
        <li>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              isSearchPage ? 'bg-muted text-slate-900 font-bold' : 'text-slate-500',
              'flex items-center gap-2 min-w-[100px]',
            )}
            onClick={() => router.push(`/hospital/${hosId}/notes/search`)}
          >
            <SearchIcon size={16} />
            노트검색
          </Button>
        </li>
      </ul>
    </footer>
  )
}

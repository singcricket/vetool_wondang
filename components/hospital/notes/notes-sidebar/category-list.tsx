'use client'

import { cn } from '@/lib/utils/utils'
import { HashIcon, ChevronRightIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NoteCategoryNode, NotesCategoryConfig } from '@/types/notes/notes_index'

interface CategoryListProps {
  categories: NotesCategoryConfig
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  isLoading: boolean
  className?: string
}

export default function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading,
  className,
}: CategoryListProps) {
  // Recursive category rendering
  const renderCategory = (node: NoteCategoryNode, depth = 0) => {
    const isActive = selectedCategory === node.label
    
    return (
      <div key={node.id} className="space-y-1">
        <button
          onClick={() => onSelectCategory(node.label === '전체 보기' ? null : node.label)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all group',
            isActive || (selectedCategory === null && node.label === '전체 보기')
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            depth > 0 && 'ml-4'
          )}
        >
          <HashIcon size={12} className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-600'
          )} />
          <span className="truncate">{node.label}</span>
          {node.children && node.children.length > 0 && (
            <ChevronRightIcon size={10} className={cn("ml-auto", isActive? "text-white/70" : "text-slate-300")} />
          )}
        </button>
        {node.children?.map(child => renderCategory(child, depth + 1))}
      </div>
    )
  }

  return (
    <ScrollArea className={cn("flex-1 py-4", className)}>
      <div className="space-y-1 px-3 pb-20">
        {isLoading ? (
           <div className="animate-pulse space-y-4 px-2">
              {[1, 2, 3, 4].map(i => (
                 <div key={i} className="h-6 bg-slate-100 rounded" />
              ))}
           </div>
        ) : (
          categories.map(cat => renderCategory(cat))
        )}
      </div>
    </ScrollArea>
  )
}

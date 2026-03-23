'use client'

import { LayoutGridIcon, CheckIcon, ChevronDownIcon } from 'lucide-react'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/utils'
import { NoteCategoryNode } from '@/types/notes/notes_index'

interface Props {
  flatCategories: { label: string, depth: number }[]
  userTags: string[]
  onToggleCategory: (category: string) => void
}

export default function NotesCategorySelect({ 
  flatCategories, 
  userTags, 
  onToggleCategory 
}: Props) {
  // Find currently selected categories to display count or labels
  const selectedInCategories = flatCategories
    .filter(cat => userTags.includes(cat.label))
    .map(cat => cat.label)

  return (
    <div className="w-full relative flex items-center h-10">
      <Label className="absolute left-4 text-slate-400 z-10 pointer-events-none flex items-center justify-center w-5 h-5">
        <LayoutGridIcon size={16} />
      </Label>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="pl-14 pr-3 h-10 w-full border-slate-200 hover:border-slate-300 transition-colors shadow-none justify-between text-slate-500 font-medium text-xs truncate overflow-hidden bg-white group"
          >
            <span className={cn(
               "line-clamp-1 text-left flex-1",
               selectedInCategories.length > 0 ? "text-slate-900 font-bold" : "text-slate-400"
            )}>
               {selectedInCategories.length > 0 
                  ? selectedInCategories.join(', ') 
                  : '카테고리 선택 (복수 가능)'
               }
            </span>
            <ChevronDownIcon size={14} className="ml-2 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start" sideOffset={8}>
          <div className="p-3 border-b bg-slate-50/50">
             <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Select Categories</h3>
          </div>
          <ScrollArea className="h-64 p-1">
            <div className="p-1 space-y-0.5">
              {flatCategories.map(cat => {
                const isSelected = userTags.includes(cat.label)
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => onToggleCategory(cat.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-all",
                      isSelected 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border transition-colors",
                      isSelected 
                        ? "bg-white border-white text-slate-900" 
                        : "bg-white border-slate-300"
                    )}>
                      {isSelected && <CheckIcon size={12} strokeWidth={3} />}
                    </div>
                    <span className={cn(
                       "truncate",
                       cat.depth > 0 && "opacity-80"
                    )}>
                       {cat.depth > 0 && Array(cat.depth).fill('↳').join(' ')} {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}

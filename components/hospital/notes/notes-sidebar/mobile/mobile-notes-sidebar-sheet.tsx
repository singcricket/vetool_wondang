'use client'

import { useState } from 'react'
import { MenuIcon, HashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { NotesCategoryConfig } from '@/types/notes/notes_index'
import CategoryList from '../category-list'

interface Props {
  hosId: string
  categories: NotesCategoryConfig
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  isLoading: boolean
}

export default function MobileNotesSidebarSheet({
  hosId,
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (category: string | null) => {
    onSelectCategory(category)
    setIsOpen(false)
  }

  return (
    <div className="2xl:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-0 left-0 z-40 h-12 w-12 rounded-none bg-slate-900 border-none text-white hover:bg-slate-800 hover:text-white"
          >
            <MenuIcon size={20} />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="px-0 py-0 flex flex-col w-72 border-r-slate-200" noCloseButton>
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>Categories</SheetTitle>
              <SheetDescription>Knowledge Hub Categories</SheetDescription>
            </SheetHeader>
          </VisuallyHidden>

          <div className="flex h-12 items-center px-6 border-b bg-slate-900 shrink-0">
             <HashIcon size={16} className="text-blue-400 mr-2" />
             <h2 className="text-sm font-black text-white uppercase tracking-widest">Category</h2>
          </div>

          <CategoryList 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelect}
            isLoading={isLoading}
            className="bg-white"
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

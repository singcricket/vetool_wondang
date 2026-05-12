'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { MobileCytologySidebar } from './mobile-cytology-sidebar'
import type { CytologySidebarItem } from '@/lib/services/cytology/fetch-cytology'

type Props = {
  items: CytologySidebarItem[]
  targetDate: string
  hosId: string
}

export function MobileCytologySidebarSheet({ items, targetDate, hosId }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div className="2xl:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button className="fixed left-0 top-0 z-40 h-10 w-10 rounded-none shadow-md bg-violet-600 hover:bg-violet-700" size="icon">
            <MenuIcon size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] px-0 py-2" noCloseButton>
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>세포학 검사 차트 사이드바</SheetTitle>
              <SheetDescription>환자 목록 및 차트 날짜를 선택할 수 있는 사이드바입니다.</SheetDescription>
            </SheetHeader>
          </VisuallyHidden>
          <MobileCytologySidebar
            handleCloseMobileDrawer={() => setIsSheetOpen(false)}
            items={items}
            targetDate={targetDate}
            hosId={hosId}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

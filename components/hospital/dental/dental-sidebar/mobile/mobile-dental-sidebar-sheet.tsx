'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import DentalDesktopSidebar from '../dental-desktop-sidebar'
import type { DentalSidebarItem } from '@/types/dental/dental-type'

interface MobileDentalSidebarSheetProps {
  hosId: string
  targetDate: string
  items: DentalSidebarItem[]
}

export function MobileDentalSidebarSheet({
  hosId,
  targetDate,
  items,
}: MobileDentalSidebarSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-24 z-40 2xl:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] p-0 sm:w-[300px]">
        <SheetHeader className="sr-only">
          <SheetTitle>치과차트 메뉴</SheetTitle>
        </SheetHeader>
        <div className="h-full pt-10">
          <DentalDesktopSidebar
            hosId={hosId}
            targetDate={targetDate}
            items={items}
            handleCloseMobileDrawer={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'

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
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { MobileDentalSidebar } from './mobile-dental-sidebar'
import { DentalSidebarItem } from '@/types/dental/dental-type'

type Props = {
  items: DentalSidebarItem[]
  targetDate: string
  hosId: string
}

export function MobileDentalSidebarSheet({
  items,
  targetDate,
  hosId,
}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleCloseMobileDrawer = () => setIsSheetOpen(false)

  return (
    <div className="2xl:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed left-0 top-0 z-40 h-10 w-10 rounded-none shadow-md"
            size="icon"
          >
            <MenuIcon size={20} />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[240px] px-0 py-2" noCloseButton>
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle />
              <SheetDescription />
            </SheetHeader>
          </VisuallyHidden>

          <MobileDentalSidebar
            handleCloseMobileDrawer={handleCloseMobileDrawer}
            items={items}
            targetDate={targetDate}
            hosId={hosId}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

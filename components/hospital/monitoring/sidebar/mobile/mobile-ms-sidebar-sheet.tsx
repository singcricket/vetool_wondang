'use client'

import MobileSidebar from '@/components/hospital/icu/sidebar/mobile/mobile-icu-sidebar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { MonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'
import type { Vet } from '@/types'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import MobileMsSidebar from './mobile-ms-sidebar'

type Props = {
  monitoringSidebarData: MonitoringSidebarData[]
  vetList: Vet[]
  targetDate: string
  hosId: string
}

export function MobileMsSidebarSheet({
  monitoringSidebarData,
  vetList,
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
            className="fixed top-0 z-40 h-12 w-12 rounded-none"
            size="icon"
          >
            <MenuIcon size={24} />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="px-0 py-2" noCloseButton>
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle />
              <SheetDescription />
            </SheetHeader>
          </VisuallyHidden>

         <MobileMsSidebar
         handleCloseMobileDrawer={handleCloseMobileDrawer}
         monitoringSidebarData={monitoringSidebarData}
         vetList={vetList}
         targetDate={targetDate}
         hosId={hosId}
         />
        </SheetContent>
      </Sheet>
    </div>
  )
}

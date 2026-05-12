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
import { MobileNeuroSidebar } from './mobile-neuro-sidebar'
import { NeuroSidebarItem } from '@/lib/services/neuro/fetch-neuro'

type Props = {
  items: NeuroSidebarItem[]
  targetDate: string
  hosId: string
}

export function MobileNeuroSidebarSheet({
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
              <SheetTitle>신경계 진료 차트 사이드바</SheetTitle>
              <SheetDescription>
                환자 목록 및 차트 날짜를 선택할 수 있는 사이드바입니다.
              </SheetDescription>
            </SheetHeader>
          </VisuallyHidden>

          <MobileNeuroSidebar
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

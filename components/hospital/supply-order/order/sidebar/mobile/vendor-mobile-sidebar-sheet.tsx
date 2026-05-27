'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { MenuIcon } from 'lucide-react'
import VendorSidebarContent from '../vendor-sidebar-content'
import type { Vendor } from '@/types/hospital/supply-order-type'

interface Props {
  hosId: string
  vendors: Vendor[]
}

export default function VendorMobileSidebarSheet({ hosId, vendors }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="2xl:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          className="fixed left-0 top-12 z-40 h-10 w-10 rounded-none shadow-md 2xl:hidden"
          size="icon"
          onClick={() => setOpen(true)}
        >
          <MenuIcon size={20} />
        </Button>

        <SheetContent side="left" className="w-[220px] px-0 py-0" noCloseButton>
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>업체 선택</SheetTitle>
              <SheetDescription>주문할 업체를 선택하세요.</SheetDescription>
            </SheetHeader>
          </VisuallyHidden>
          <VendorSidebarContent
            hosId={hosId}
            vendors={vendors}
            onSelect={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

import type { Vendor } from '@/types/hospital/supply-order-type'
import VendorSidebarContent from './vendor-sidebar-content'

interface Props {
  hosId: string
  vendors: Vendor[]
}

export default function VendorDesktopSidebar({ hosId, vendors }: Props) {
  return (
    <aside className="fixed z-40 hidden h-[calc(100vh-3.5rem-3.5rem)] w-[200px] shrink-0 flex-col border-r bg-white 2xl:flex">
      <VendorSidebarContent hosId={hosId} vendors={vendors} />
    </aside>
  )
}

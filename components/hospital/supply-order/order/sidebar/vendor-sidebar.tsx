import { getVendors } from '@/lib/actions/supply-order/vendor-actions'
import VendorDesktopSidebar from './vendor-desktop-sidebar'
import VendorMobileSidebarSheet from './mobile/vendor-mobile-sidebar-sheet'

interface Props {
  hosId: string
}

export default async function VendorSidebar({ hosId }: Props) {
  const vendors = await getVendors(hosId)

  return (
    <>
      <VendorDesktopSidebar hosId={hosId} vendors={vendors} />
      <VendorMobileSidebarSheet hosId={hosId} vendors={vendors} />
    </>
  )
}

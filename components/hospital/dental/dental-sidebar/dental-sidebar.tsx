import { fetchDentalSidebarData } from '@/lib/services/dental/fetch-dental'
import DentalDesktopSidebar from './dental-desktop-sidebar'
import { MobileDentalSidebarSheet } from './mobile/mobile-dental-sidebar-sheet'

interface DentalSidebarProps {
  hosId: string
  targetDate: string
}

export default async function DentalSidebar({
  hosId,
  targetDate,
}: DentalSidebarProps) {
  const initialItems = await fetchDentalSidebarData(hosId, targetDate)

  return (
    <>
      <DentalDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />

      <MobileDentalSidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
    </>
  )
}

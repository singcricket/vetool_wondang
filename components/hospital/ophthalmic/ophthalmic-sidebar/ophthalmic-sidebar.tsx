import { fetchOphthalmicSidebarData } from '@/lib/services/ophthalmic/fetch-ophthalmic'
import OphthalmicDesktopSidebar from './ophthalmic-desktop-sidebar'
import { MobileOphthalmicSidebarSheet } from './mobile/mobile-ophthalmic-sidebar-sheet'

interface OphthalmicSidebarProps {
  hosId: string
  targetDate: string
}

export default async function OphthalmicSidebar({
  hosId,
  targetDate,
}: OphthalmicSidebarProps) {
  const initialItems = await fetchOphthalmicSidebarData(hosId, targetDate)

  return (
    <>
      <OphthalmicDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
      <MobileOphthalmicSidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
    </>
  )
}

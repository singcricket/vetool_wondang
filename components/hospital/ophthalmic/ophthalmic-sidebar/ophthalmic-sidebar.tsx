import { fetchOphthalmicSidebarData } from '@/lib/services/ophthalmic/fetch-ophthalmic'
import OphthalmicDesktopSidebar from './ophthalmic-desktop-sidebar'

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
    </>
  )
}

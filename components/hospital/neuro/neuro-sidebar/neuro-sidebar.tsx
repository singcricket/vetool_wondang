import { fetchNeuroSidebarData } from '@/lib/services/neuro/fetch-neuro'
import NeuroDesktopSidebar from './neuro-desktop-sidebar'
import { MobileNeuroSidebarSheet } from './mobile/mobile-neuro-sidebar-sheet'

interface NeuroSidebarProps {
  hosId: string
  targetDate: string
}

export default async function NeuroSidebar({
  hosId,
  targetDate,
}: NeuroSidebarProps) {
  const initialItems = await fetchNeuroSidebarData(hosId, targetDate)

  return (
    <>
      <NeuroDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
      <MobileNeuroSidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
    </>
  )
}

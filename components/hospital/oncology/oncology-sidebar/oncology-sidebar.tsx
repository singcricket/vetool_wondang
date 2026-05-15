import { fetchOncologySidebarData } from '@/lib/services/oncology/fetch-oncology'
import OncologyDesktopSidebar from './oncology-desktop-sidebar'
import { MobileOncologySidebarSheet } from './mobile/mobile-oncology-sidebar-sheet'

interface OncologySidebarProps {
  hosId: string
  targetDate: string
}

export default async function OncologySidebar({ hosId, targetDate }: OncologySidebarProps) {
  const initialItems = await fetchOncologySidebarData(hosId, targetDate)

  return (
    <>
      <OncologyDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />

      <MobileOncologySidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
    </>
  )
}

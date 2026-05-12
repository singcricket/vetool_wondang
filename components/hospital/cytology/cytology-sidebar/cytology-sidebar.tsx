import { fetchCytologySidebarData } from '@/lib/services/cytology/fetch-cytology'
import CytologyDesktopSidebar from './cytology-desktop-sidebar'
import { MobileCytologySidebarSheet } from './mobile/mobile-cytology-sidebar-sheet'

interface Props {
  hosId: string
  targetDate: string
}

export default async function CytologySidebar({ hosId, targetDate }: Props) {
  const initialItems = await fetchCytologySidebarData(hosId, targetDate)

  return (
    <>
      <CytologyDesktopSidebar hosId={hosId} targetDate={targetDate} items={initialItems} />
      <MobileCytologySidebarSheet hosId={hosId} targetDate={targetDate} items={initialItems} />
    </>
  )
}

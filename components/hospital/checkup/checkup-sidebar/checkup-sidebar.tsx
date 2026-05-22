import { fetchCheckupSidebarData } from '@/lib/services/checkup/fetch-checkup'
import CheckupDesktopSidebar from './checkup-desktop-sidebar'
import { MobileCheckupSidebarSheet } from './mobile/mobile-checkup-sidebar-sheet'

interface Props {
  hosId: string
  targetDate: string
}

export default async function CheckupSidebar({ hosId, targetDate }: Props) {
  const items = await fetchCheckupSidebarData(hosId, targetDate)

  return (
    <>
      <CheckupDesktopSidebar hosId={hosId} targetDate={targetDate} items={items} />
      <MobileCheckupSidebarSheet hosId={hosId} targetDate={targetDate} items={items} />
    </>
  )
}

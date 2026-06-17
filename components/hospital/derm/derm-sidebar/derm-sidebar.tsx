import { fetchDermSidebarData } from '@/lib/services/derm/fetch-derm'
import DermDesktopSidebar from './derm-desktop-sidebar'

interface Props {
  hosId: string
  targetDate: string
}

export default async function DermSidebar({ hosId, targetDate }: Props) {
  const items = await fetchDermSidebarData(hosId, targetDate)
  return <DermDesktopSidebar hosId={hosId} targetDate={targetDate} items={items} />
}

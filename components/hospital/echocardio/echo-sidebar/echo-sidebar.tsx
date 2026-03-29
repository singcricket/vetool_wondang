import { fetchEchoSidebarData } from '@/lib/services/echocardio/fetch-echo'
import EchoDesktopSidebar from './echo-desktop-sidebar'
import { MobileEchoSidebarSheet } from './mobile/mobile-echo-sidebar-sheet'

interface EchoSidebarProps {
  hosId: string
  targetDate: string
}

export default async function EchoSidebar({
  hosId,
  targetDate,
}: EchoSidebarProps) {
  const initialItems = await fetchEchoSidebarData(hosId, targetDate)

  return (
    <>
      <EchoDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />

      <MobileEchoSidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />
    </>
  )
}

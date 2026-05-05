import { fetchUltrasoundSidebarData } from '@/lib/services/ultrasound/fetch-ultrasound'
import UltrasoundDesktopSidebar from './ultrasound-desktop-sidebar'
// import { MobileUltrasoundSidebarSheet } from './mobile/mobile-ultrasound-sidebar-sheet'

interface UltrasoundSidebarProps {
  hosId: string
  targetDate: string
}

export default async function UltrasoundSidebar({
  hosId,
  targetDate,
}: UltrasoundSidebarProps) {
  const initialItems = await fetchUltrasoundSidebarData(hosId, targetDate)

  return (
    <>
      <UltrasoundDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      />

      {/* 모바일 버전은 추후 필요시 활성화 */}
      {/* <MobileUltrasoundSidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        items={initialItems}
      /> */}
    </>
  )
}

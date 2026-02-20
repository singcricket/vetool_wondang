// import ClMobileSidebarSheet from './mobile/cl-mobile-sidebar-sheet'
import { fetchMonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'
import MsDesktopSidebar from './ms-desktop-sidebar'
import { Vet } from '@/types'

type Props = {
  hosId: string
  targetDate: string
   vetList: Vet[]
  hosGroupList: string[]
}
export default async function MsSidebar({ hosId, targetDate, hosGroupList, vetList }: Props) {
  const monitoringSidebarData = await fetchMonitoringSidebarData(
    hosId,
    targetDate
  )

  return (
    <>
      <MsDesktopSidebar
        hosId={hosId}
        targetDate={targetDate}
        monitoringSidebarData={monitoringSidebarData}
         hosGroupList={hosGroupList}
        vetList={vetList}
      />

      {/* <ClMobileSidebarSheet
        hosId={hosId}
        targetDate={targetDate}
        checklistSidebarData={checklistSidebarData}
      /> */}
    </>
  )
}

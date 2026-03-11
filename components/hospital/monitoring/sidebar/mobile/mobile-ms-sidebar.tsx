import NoResultSquirrel from '@/components/common/no-result-squirrel'
import IcuDateSelector from '@/components/hospital/icu/sidebar/date-selector/icu-date-selector'
import PatientList from '@/components/hospital/icu/sidebar/patient-list/patient-list'
import { Separator } from '@/components/ui/separator'
import { MonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'
import type { Vet } from '@/types'
import { DEFAULT_MS_FILTER_STATE, filterPatients } from '../filters/filters'
import MsPatientList from '../ms-patient-list'

type Props = {
  handleCloseMobileDrawer?: () => void
  monitoringSidebarData: MonitoringSidebarData[]
  vetList: Vet[]
  targetDate: string
  hosId: string
}

export default function MobileMsSidebar({
  handleCloseMobileDrawer,
  monitoringSidebarData,
  vetList,
  targetDate,
  hosId,
}: Props) {
  // 모바일에서는 필터기능 필요없음
  const filteredData = filterPatients(
    monitoringSidebarData,
    DEFAULT_MS_FILTER_STATE, // 따라서 기본 필터 적용
    vetList,
  )

  return (
    <aside className="flex flex-col">
      <IcuDateSelector targetDate={targetDate} />

      <Separator className="mt-2" />

      {monitoringSidebarData.length === 0 ? (
        <NoResultSquirrel
          text="입원환자가 없습니다"
          className="mt-10 flex-col"
        />
      ) : (
        <div className="h-[calc(100vh-40px)] overflow-y-auto p-2">
        <MsPatientList
        filteredData={filteredData}
        hosId={hosId}
        targetDate={targetDate}
        filters={DEFAULT_MS_FILTER_STATE}
        vetList={vetList}
        />
        </div>
      )}
    </aside>
  )
}

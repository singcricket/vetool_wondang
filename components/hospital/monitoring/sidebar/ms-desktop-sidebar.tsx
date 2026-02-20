'use client'
import NoResultSquirrel from '@/components/common/no-result-squirrel'
import { Separator } from '@/components/ui/separator'
import type { MonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'
import MsDateSelector from '@/components/hospital/monitoring/sidebar/date-selector/ms-date-selector'
import MsRegisterDialog from '@/components/hospital/monitoring/sidebar/ms-register-dialog/ms-register-dialog'
import MsPatientList from '@/components/hospital/monitoring/sidebar/ms-patient-list'
import { Suspense } from 'react'
import Filters, {
  DEFAULT_MS_FILTER_STATE,
  filterPatients,
} from '@/components/hospital/monitoring/sidebar/filters/filters'
import type { Vet } from '@/types'
import useLocalStorage from '@/hooks/use-local-storage'
import MsEmergencyDialog from '@/components/hospital/monitoring/sidebar/ms-emergency-dialog'

type Props = {
  hosId: string
  targetDate: string
  vetList: Vet[]
  hosGroupList: string[]
  monitoringSidebarData: MonitoringSidebarData[]
  handleCloseMobileDrawer?: () => void
}
export default function MsDesktopSidebar({
  hosId,
  targetDate,
  vetList,
  hosGroupList,
  monitoringSidebarData,
  handleCloseMobileDrawer,
}: Props) {
    const [filters, setFilters] = useLocalStorage(
    `msPatientFilter`,
    DEFAULT_MS_FILTER_STATE
  )
  const filteredData = filterPatients(monitoringSidebarData, filters, vetList)
  return (
    <aside className="fixed z-40 hidden h-desktop w-96 shrink-0 flex-col gap-2 border-r bg-white px-2 pb-0 pt-2 2xl:flex">
        <Suspense>
      <MsDateSelector hosId={hosId} targetDate={targetDate} />
      </Suspense>

      <div className="flex flex-col gap-2">
        <MsRegisterDialog hosId={hosId} targetDate={targetDate} />

        <MsEmergencyDialog hosId={hosId} targetDate={targetDate} />
      </div>

      <Separator />

      {monitoringSidebarData.length === 0 ? (
        <NoResultSquirrel
          text="체크리스트 환자 없음"
          size="md"
          className="mt-20 flex-col"
        />
      ) : (
        <>
          <Filters
            hosGroupList={hosGroupList}
            vetList={vetList}
            filters={filters}
            setFilters={setFilters}
          />
        <MsPatientList
         filters={filters}
          filteredData={filteredData}
          handleCloseMobileDrawer={handleCloseMobileDrawer}
          hosId={hosId}
          targetDate={targetDate}
          vetList={vetList}
        />
        </>
        
      )}
    </aside>
  )
}

'use client'
import type { MonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'
import MsPatientButton from './ms-patient-button'
import type { FilteredMsData, FilterMsState } from './filters/filters'
import type { Vet } from '@/types'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/utils'

type Props = {
  filteredData: FilteredMsData
  handleCloseMobileDrawer?: () => void
  hosId: string
  targetDate: string
  filters: FilterMsState
  vetList: Vet[]
}
export default function MsPatientList({
  filters,
  filteredData,
  handleCloseMobileDrawer,
  hosId,
  vetList,
  targetDate,
}: Props) {

   const isFilterSelected = filters.selectedGroup || filters.selectedVet
  const { filteredMsData, excludedMsData, outMsData } = filteredData

  const filteredCount = filteredMsData.length
  const excludedCount = excludedMsData.length
  const outCount = outMsData.length
  return (
    <div className="flex-col gap-3 overflow-y-auto">
      {/* 입원 중인 환자가 0명인 경우 */}
      {filteredCount + excludedCount === 0 ? (
        <div className="mb-2 text-xs font-bold">모니터링 중인 환자 (0)</div>
      ) : (
        <ul className="flex flex-col gap-2">
          <li className="flex items-center justify-between text-xs font-bold">
            <span className={cn('font-bold', filteredCount === 0 && 'mb-2')}>
              {isFilterSelected ? '필터링된 ' : ''}
              모니터링 중인 환자 ({filteredCount})
            </span>
          </li>

          {filteredMsData.map((msData) => (
            <li
              key={msData.session_id}
              className="w-full last:mb-2"
              onClick={handleCloseMobileDrawer}
            >
              <MsPatientButton
                monitoringSession={msData}
                vetList={vetList}
                hosId={hosId}
                targetDate={targetDate}
              />
            </li>
          ))}
        </ul>
      )}

      {excludedCount > 0 && (
        <>
          <Separator className="mb-2" />

          <ul className="flex flex-col gap-2">
            <li className="text-xs font-bold">필터링 제외 ({excludedCount})</li>
            {excludedMsData.map((msData) => (
              <li
                key={msData.session_id}
                className="w-full last:mb-2"
                onClick={handleCloseMobileDrawer}
              >
                <MsPatientButton
                  monitoringSession={msData}
                  vetList={vetList}
                  hosId={hosId}
                  targetDate={targetDate}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {outCount > 0 && (
        <>
          <Separator className="mb-2" />

          <ul className="flex flex-col gap-2">
            <li className="text-xs font-bold text-muted-foreground">
              종료된 환자 ({outCount})
            </li>
            {outMsData.map((msData) => (
              <li
                key={msData.session_id}
                className="w-full last:mb-2"
                onClick={handleCloseMobileDrawer}
              >
                <MsPatientButton
                  monitoringSession={msData}
                  vetList={vetList}
                  hosId={hosId}
                  targetDate={targetDate}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

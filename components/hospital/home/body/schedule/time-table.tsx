'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useMemo, useState } from 'react'
import { isSameMonth, startOfMonth } from 'date-fns'
import { 
  fetchHospitalMetadata, 
  fetchScheduleSetting 
} from '@/lib/services/hospital-home/todo'
import { HospitalMetadata } from '../todo/todo'
import { ScheduleSetting } from '@/types/hospital'
import { useMonthSchedules } from '@/hooks/use-month-schedule'
import ScheduleCalendar from './schedule-calendar'
import ScheduleList from './schedule-list'
import ScheduleUserFilter from './schedule-user-filter'
import ScheduleCategoryFilter from './schedule-category-filter'
import UpsertScheduleDialog from './upsert-schedule-dialog'
import TimeTableSettingsDialog from './time-table-settings-dialog'
import ScheduleAuthoringTable from './schedule-authoring-table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  hosId: string
  metadata: HospitalMetadata
  loggedInUserId: string
  selectedUserFilter: string[]
  setSelectedUserFilter: (val: string[] | ((prev: string[]) => string[])) => void
}

export default function TimeTable({
  hosId,
  metadata,
  loggedInUserId,
  selectedUserFilter,
  setSelectedUserFilter,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [scheduleSetting, setScheduleSetting] =
    useState<ScheduleSetting | null>(null)

  // 필터 상태 (공유 상태 사용)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string[]>(
    [],
  )

  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false)

  useEffect(() => {
    if (!hosId) return
    const loadSetting = async () => {
      try {
        const setting = await fetchScheduleSetting(hosId)
        setScheduleSetting(setting)
      } catch (error) {
        console.error('Failed to load schedule setting:', error)
      }
    }
    loadSetting()
  }, [hosId])

  const { schedulesByDate, refetch, isFetching } = useMonthSchedules(
    hosId,
    currentMonth,
  )

  // 달력 이동 시 날짜 동기화
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate))
    }
  }, [selectedDate])

  const filteredSchedulesByDate = useMemo(() => {
    const result: typeof schedulesByDate = {}
    Object.entries(schedulesByDate).forEach(([date, daySchedules]) => {
      result[date] = daySchedules.filter((schedule) => {
        const targets = schedule.target_users || []
        const isCreator = schedule.created_by === loggedInUserId
        const currentUser = metadata.users.find(u => u.user_id === loggedInUserId)
        const isMaster = currentUser?.is_admin === true
        const isUnassigned = targets.length === 0

        const targetedGroups = targets.filter(t => metadata.groups.includes(t))

        // --- 1. 접근 권한 체크 (Accessibility Check) ---
        let isAccessible = false
        if (isCreator || isUnassigned || targets.includes(loggedInUserId || '')) {
          isAccessible = true
        } else {
          const myGroups = currentUser?.group || []
          const isTargetedAtMyGroup = targetedGroups.some(g => myGroups.includes(g))
          
          if (isTargetedAtMyGroup) {
            isAccessible = true
          } else if (isMaster && targetedGroups.length > 0) {
            // 마스터는 '그룹'이 하나라도 포함된 경우 모든 그룹 일정 열람 가능
            isAccessible = true
          }
        }

        if (!isAccessible) return false

        // --- 2. UI 필터링 체크 (UI Filter Logic) ---
        if (selectedUserFilter.length === 0 && selectedCategoryFilter.length === 0)
          return true

        const filterIds = selectedUserFilter;
        const filterNames = selectedUserFilter
          .map(id => metadata.users.find(u => u.user_id === id)?.name)
          .filter(Boolean) as string[];

        // A. 담당자/유저/그룹 필터 확인
        const isUserMatch = targets.some((t) => filterIds.includes(t) || filterNames.includes(t))
        
        // B. 미지정 필터 확인
        const isUnassignedMatch = isUnassigned && (selectedUserFilter.includes('미정') || selectedUserFilter.includes('미지정'))

        // C. 내가 작성한 글 필터 확인
        const isCreatedByMeMatch = selectedUserFilter.includes('__created_by_me__') && isCreator

        // D. 카테고리 필터 확인
        const isCategoryMatch = selectedCategoryFilter.length === 0 || selectedCategoryFilter.includes(schedule.category || '일반')

        const passesUserFilter = selectedUserFilter.length === 0 || isUserMatch || isUnassignedMatch || isCreatedByMeMatch
        const passesCategoryFilter = isCategoryMatch

        return passesUserFilter && passesCategoryFilter
      })
    })
    return result
  }, [schedulesByDate, selectedUserFilter, selectedCategoryFilter, metadata.users, metadata.groups, loggedInUserId, metadata.master_user_id])

  return (
    <Card className="w-full rounded-sm border-none shadow-none bg-transparent">
      <CardHeader className="p-4 bg-white rounded-t-sm border shadow-sm mb-4">
        <CardTitle>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h4 className="font-bold text-slate-800 text-lg">📅 Hospital Schedule</h4>
              
              <div className="flex items-center gap-2">
                <UpsertScheduleDialog
                  hosId={hosId}
                  date={selectedDate}
                  refetch={refetch}
                  metadata={metadata}
                />
                
                <Dialog open={isAuthoringOpen} onOpenChange={setIsAuthoringOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                      <Edit2 size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:text-white [&>button]:bg-slate-800/50 [&>button]:rounded-full [&>button]:hover:bg-slate-800">
                    <DialogHeader className="hidden">
                      <DialogTitle>스케줄 작성</DialogTitle>
                    </DialogHeader>
                    <div className="h-full pt-10">
                      <ScheduleAuthoringTable
                        hosId={hosId}
                        loggedInUserId={loggedInUserId}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        metadata={metadata}
                        scheduleSetting={scheduleSetting}
                        refetch={async () => {
                          await refetch()
                        }}
                        schedulesByDate={schedulesByDate}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <TimeTableSettingsDialog hosId={hosId} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ScheduleUserFilter
                metadata={metadata}
                loggedInUserId={loggedInUserId}
                selectedValues={selectedUserFilter}
                onSelectionChange={setSelectedUserFilter}
              />
              <ScheduleCategoryFilter
                categories={scheduleSetting?.schedule_categories || []}
                selectedValues={selectedCategoryFilter}
                onSelectionChange={setSelectedCategoryFilter}
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 달력 영역 */}
          <div className="hidden sm:block flex-[3] bg-white p-4 rounded-sm border shadow-sm">
            <ScheduleCalendar
              hosId={hosId}
              schedulesByDate={filteredSchedulesByDate}
              refetch={refetch}
              isFetching={isFetching}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              metadata={metadata}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>

          {/* 일일 리스트 영역 */}
          <div className="flex-[1.2] bg-white p-4 rounded-sm border shadow-sm min-w-[320px]">
            <ScheduleList
              hosId={hosId}
              schedulesByDate={schedulesByDate}
              selectedUserFilter={selectedUserFilter}
              selectedCategoryFilter={selectedCategoryFilter}
              refetch={refetch}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              metadata={metadata}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

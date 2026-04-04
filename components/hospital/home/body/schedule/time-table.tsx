'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useMemo, useState } from 'react'
import { isSameMonth, startOfMonth } from 'date-fns'
import {
  fetchHospitalMetadata,
  fetchScheduleSetting,
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

type Props = {
  hosId: string
  selectedUserFilter: string[]
  setSelectedUserFilter: (val: string[] | ((prev: string[]) => string[])) => void
}

export default function TimeTable({
  hosId,
  selectedUserFilter,
  setSelectedUserFilter,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [metadata, setMetadata] = useState<HospitalMetadata>({
    users: [],
    groups: [],
  })
  const [scheduleSetting, setScheduleSetting] =
    useState<ScheduleSetting | null>(null)

  // 필터 상태 (공유 상태 사용)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string[]>(
    [],
  )

  useEffect(() => {
    if (!hosId) return
    const loadData = async () => {
      try {
        const [meta, setting] = await Promise.all([
          fetchHospitalMetadata(hosId),
          fetchScheduleSetting(hosId),
        ])
        if (meta && 'users' in meta) setMetadata(meta as HospitalMetadata)
        setScheduleSetting(setting)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
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
    if (selectedUserFilter.length === 0 && selectedCategoryFilter.length === 0)
      return schedulesByDate

    const result: typeof schedulesByDate = {}
    Object.entries(schedulesByDate).forEach(([date, daySchedules]) => {
      result[date] = daySchedules.filter((schedule) => {
        // 담당자 필터
        const targets = schedule.target_users || []
        const isUnassignedMatch =
          targets.length === 0 && selectedUserFilter.includes('미지정')
        const isUserMatch =
          selectedUserFilter.length === 0 ||
          isUnassignedMatch ||
          targets.some((t) => selectedUserFilter.includes(t))

        // 카테고리 필터
        const isCategoryMatch =
          selectedCategoryFilter.length === 0 ||
          selectedCategoryFilter.includes(schedule.category || '일반')

        return isUserMatch && isCategoryMatch
      })
    })
    return result
  }, [schedulesByDate, selectedUserFilter, selectedCategoryFilter])

  return (
    <Card className="w-full rounded-sm border-none shadow-none bg-transparent">
      <CardHeader className="p-4 bg-white rounded-t-sm border shadow-sm mb-4">
        <CardTitle>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-lg">
              <h4 className="font-bold text-slate-800">📅 Hospital Schedule</h4>
              <UpsertScheduleDialog
                hosId={hosId}
                date={selectedDate}
                refetch={refetch}
                metadata={metadata}
              />
              <TimeTableSettingsDialog hosId={hosId} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ScheduleUserFilter
                metadata={metadata}
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

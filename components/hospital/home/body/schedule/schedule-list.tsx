'use client'

import { useMemo, useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ko } from 'date-fns/locale'
import { Schedule } from '@/types/hospital/schedule'
import SingleSchedule from './single-schedule'
import { HospitalMetadata } from '../todo/todo'

type Props = {
  hosId: string
  loggedInUserId: string
  schedulesByDate: Record<string, Schedule[]>
  selectedUserFilter: string[]
  selectedCategoryFilter: string[]
  refetch: () => Promise<void>
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
  metadata: HospitalMetadata
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  isAdmin: boolean
}

export default function ScheduleList({
  hosId,
  loggedInUserId,
  schedulesByDate,
  selectedUserFilter,
  selectedCategoryFilter,
  refetch,
  currentMonth,
  setCurrentMonth,
  metadata,
  selectedDate,
  setSelectedDate,
  isAdmin,
}: Props) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const allTodaySchedules = schedulesByDate[dateStr] || []

  const { matchingSchedules, remainingSchedules } = useMemo(() => {
    // 관리 전용 필터링: 관리자가 아닐 경우 'admin'이 포함된 스케줄은 아예 보이지 않게 처리
    const accessibleSchedules = allTodaySchedules.filter(schedule => {
      const targets = schedule.target_users || []
      if (!isAdmin && targets.includes('admin')) return false
      return true
    })

    if (
      selectedUserFilter.length === 0 &&
      selectedCategoryFilter.length === 0
    ) {
      return { matchingSchedules: accessibleSchedules, remainingSchedules: [] }
    }

    const matching: Schedule[] = []
    const remaining: Schedule[] = []

    accessibleSchedules.forEach((schedule) => {
      // 1. 담당자 매칭 (그룹 소속 여부 확인 포함)
      const targets = schedule.target_users || []
      const isCreator = schedule.created_by === loggedInUserId
      const isUnassigned = targets.length === 0

      const isUserMatch = targets.some((targetId) => {
        // 1. 직접 ID 일치
        if (selectedUserFilter.includes(targetId)) return true
        
        // 2. 해당 유저가 선택된 그룹에 속해 있는지 확인
        const userObj = metadata.users.find(u => u.user_id === targetId)
        if (userObj?.group?.some(g => selectedUserFilter.includes(g))) return true
        
        return false
      })
      
      const isUnassignedMatch = isUnassigned && (selectedUserFilter.includes('미정') || selectedUserFilter.includes('미지정'))
      const isCreatedByMeMatch = selectedUserFilter.includes('__created_by_me__') && isCreator

      const passesUserFilter = selectedUserFilter.length === 0 || isUserMatch || isUnassignedMatch || isCreatedByMeMatch

      // 2. 카테고리 매칭
      const isCategoryMatch =
        selectedCategoryFilter.length === 0 ||
        selectedCategoryFilter.includes(schedule.category || '일반')

      if (passesUserFilter && isCategoryMatch) {
        matching.push(schedule)
      } else {
        remaining.push(schedule)
      }
    })

    return { matchingSchedules: matching, remainingSchedules: remaining }
  }, [allTodaySchedules, selectedUserFilter, selectedCategoryFilter, metadata.users, loggedInUserId])

  return (
    <div className="flex flex-col gap-4">
      {/* 날짜 핸들러 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 bg-white sticky top-0 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col items-center cursor-pointer hover:bg-slate-50 rounded-md px-4 py-1.5 transition-all text-center">
              <span className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {format(selectedDate, 'yyyy. MM. dd')}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {format(selectedDate, 'EEEE', { locale: ko })}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 shadow-xl border-slate-200"
            align="center"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              locale={ko}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* 매칭 목록 */}
        <div className="space-y-3">
          <h5 className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <Filter className="h-3 w-3" />
              {selectedUserFilter.length > 0 || selectedCategoryFilter.length > 0
                ? 'MATCHED SCHEDULES'
                : 'SCHEDULES'}
            </span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-bold">
              {matchingSchedules.length}
            </span>
          </h5>

          {matchingSchedules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {matchingSchedules.map((schedule) => (
                <SingleSchedule
                  key={schedule.id}
                  schedule={schedule}
                  hosId={hosId}
                  refetch={refetch}
                  metadata={metadata}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed rounded-md bg-slate-50/30">
              일정이 없습니다
            </div>
          )}
        </div>

        {/* 나머지 목록 */}
        {remainingSchedules.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <h5 className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 opacity-60 uppercase tracking-widest">
                <Layers className="h-3 w-3" />
                OTHER SCHEDULES
              </span>
              <span className="text-[10px] bg-slate-50 px-1.5 py-0.5 rounded-full text-slate-400 font-bold">
                {remainingSchedules.length}
              </span>
            </h5>

            <div className="flex flex-col gap-3 opacity-60">
              {remainingSchedules.map((schedule) => (
                <SingleSchedule
                  key={schedule.id}
                  schedule={schedule}
                  hosId={hosId}
                  refetch={refetch}
                  metadata={metadata}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

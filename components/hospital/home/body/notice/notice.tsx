'use client'

import { fetchHospitalMetadata } from '@/lib/services/hospital-home/todo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import NoticeRefreshButton from './notice-refresh-button'
import NoticeSkeleton from './notice-skeleton'
import UpsertNoticeDialog from './upsert-notice-dialog'
import TodoUserFilter from '../todo/todo-user-filter'
import TodoFilter from '../todo/todo-filter'
import DragAndDropNoticeList from './drag-and-drop-notice-list'
import { HospitalMetadata } from '../todo/todo'
import { useNotices } from '@/hooks/use-notices'
import { useMonthTodos } from '@/hooks/use-month-todo'
import TodoMobile from '../todo/todo-mobile'
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ko } from 'date-fns/locale'

type NoticeProps = {
  hosId: string
  metadata: HospitalMetadata
  loggedInUserId: string
  activeFilter: 'all' | 'done' | 'not-done'
  setActiveFilter: Dispatch<SetStateAction<'all' | 'done' | 'not-done'>>
  selectedUserFilter: string[]
  setSelectedUserFilter: Dispatch<SetStateAction<string[]>>
}

export default function Notice({
  hosId,
  metadata,
  loggedInUserId,
  activeFilter,
  setActiveFilter,
  selectedUserFilter,
  setSelectedUserFilter,
}: NoticeProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // 리얼타임 데이터 및 페칭 훅 사용
  const {
    notices: noticesData,
    isFetching: isNoticesLoading,
    refetch: refetchNotices,
  } = useNotices(hosId)

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const {
    todosByDate,
    refetch: refetchTodos,
  } = useMonthTodos(hosId, currentMonth, activeFilter)

  // 선택된 날짜와 현재 보는 달이 동기화되도록 관리하여 "되감기" 버그 방지
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate))
    }
  }, [selectedDate, currentMonth])

  const refetch = () => {
    refetchNotices()
    refetchTodos()
  }

  const isLoading = isNoticesLoading

  const filteredNotices = useMemo(() => {
    let result = noticesData

    // 0. 날짜 필터 적용
    const targetDate = startOfDay(selectedDate)
    result = result.filter((notice) => {
      const dates = notice.target_date as { start: string; end: string | null }
      if (!dates || !dates.start) return true

      const start = startOfDay(new Date(dates.start))
      const end = dates.end ? startOfDay(new Date(dates.end)) : null

      const isStarted = isBefore(start, targetDate) || isSameDay(start, targetDate)
      const isNotEnded = !end || isAfter(end, targetDate) || isSameDay(end, targetDate)

      return isStarted && isNotEnded
    })

    // 1. 공지 접근 가능 여부 및 담당자 필터 적용
    result = result.filter((notice) => {
      const targets = (notice.target_user || '').split(',').filter(Boolean)
      const creatorId = notice.user_id && typeof notice.user_id === 'object' ? (notice.user_id as any).user_id : notice.user_id
      const isCreator = creatorId === loggedInUserId
      const currentUser = metadata.users.find((u) => u.user_id === loggedInUserId)
      const isMaster = currentUser?.is_admin === true
      const isUnassigned = targets.length === 0
      
      const targetedGroups = targets.filter(t => metadata.groups.includes(t))

      // --- 1.1 접근 권한 체크 (Accessibility Check) ---
      let isAccessible = false
      if (isCreator || isUnassigned || targets.includes(loggedInUserId || '')) {
        isAccessible = true
      } else {
        const myGroups = currentUser?.group || []
        const isTargetedAtMyGroup = targetedGroups.some(g => myGroups.includes(g))
        
        if (isTargetedAtMyGroup) {
          isAccessible = true
        } else if (isMaster && targetedGroups.length > 0) {
          // 마스터는 '그룹'이 하나라도 포함된 경우 모든 그룹 메시지 열람 가능
          isAccessible = true
        }
      }

      if (!isAccessible) return false

      // --- 1.2 UI 필터링 체크 (UI Filter Logic) ---
      if (selectedUserFilter.length === 0) return true

      const filterIds = selectedUserFilter;
      const filterNames = selectedUserFilter
        .map((id) => metadata.users.find((u) => u.user_id === id)?.name)
        .filter(Boolean) as string[]

      // A. 담당자가 없는 경우 '미지정' 필터 확인
      if (isUnassigned && (selectedUserFilter.includes('미정') || selectedUserFilter.includes('미지정'))) {
        return true
      }

      // B. 관리자/유저/그룹 필터 확인 (ID 또는 이름 매칭)
      if (targets.some((t) => filterIds.includes(t) || filterNames.includes(t))) {
        return true
      }

      // C. 내가 작성한 글 필터 확인
      if (selectedUserFilter.includes('__created_by_me__') && isCreator) {
        return true
      }

      return false
    })

    // 2. 완료 여부 필터 적용
    if (activeFilter !== 'all') {
      result = result.filter((notice) => {
        const isDone = (notice.target_date as any)?.is_done ?? false
        return activeFilter === 'done' ? isDone : !isDone
      })
    }

    return result
  }, [noticesData, selectedUserFilter, activeFilter, selectedDate])

  return (
    <Card className="mx-auto mb-6 w-full max-w-full rounded-md shadow-sm">
      <CardHeader className="border-b p-4">
        <CardTitle className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-slate-800">📌 메모/공지</h4>
              <NoticeRefreshButton onClick={refetch} isLoading={isLoading} />
            </div>
            <UpsertNoticeDialog
              hosId={hosId}
              loggedInUserId={loggedInUserId}
              metadata={metadata}
              onSubmitSuccess={refetch}
              oldStartDate={selectedDate}
            />

            {/* 날짜 핸들러 (상단 내비게이션) */}
            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex flex-col items-center cursor-pointer hover:bg-slate-50 rounded-md px-3 py-0.5 transition-all border border-transparent hover:border-slate-200">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                      <CalendarIcon className="h-3 w-3 text-primary" />
                      {format(selectedDate, 'yyyy. MM. dd')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
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
                className="h-7 w-7 rounded-full"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TodoUserFilter
              metadata={metadata}
              loggedInUserId={loggedInUserId}
              selectedValues={selectedUserFilter}
              onSelectionChange={setSelectedUserFilter}
            />
            <TodoFilter
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {isLoading ? (
              <NoticeSkeleton />
            ) : (
              <DragAndDropNoticeList
                hosId={hosId}
                loggedInUserId={loggedInUserId}
                noticesData={filteredNotices}
                metadata={metadata}
              />
            )}
          </div>

          <div className="hidden lg:block flex-[0.4] bg-white p-4 rounded-sm border shadow-sm min-w-[200px]">
            <div className="mb-4 flex items-center gap-2 border-b pb-2">
              <h4 className="text-sm font-bold text-slate-800">📋 오늘 할일(ToDo)</h4>
            </div>
            <TodoMobile
              hosId={hosId}
              loggedInUserId={loggedInUserId}
              activeFilter={activeFilter}
              todosByDate={todosByDate}
              selectedUserFilter={selectedUserFilter}
              refetch={refetchTodos}
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

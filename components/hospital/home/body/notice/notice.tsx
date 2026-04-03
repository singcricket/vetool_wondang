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
  activeFilter: 'all' | 'done' | 'not-done'
  setActiveFilter: Dispatch<SetStateAction<'all' | 'done' | 'not-done'>>
  selectedUserFilter: string[]
  setSelectedUserFilter: Dispatch<SetStateAction<string[]>>
}

export default function Notice({
  hosId,
  activeFilter,
  setActiveFilter,
  selectedUserFilter,
  setSelectedUserFilter,
}: NoticeProps) {
  const [metadata, setMetadata] = useState<HospitalMetadata>({
    users: [],
    groups: [],
  })
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
    isFetching: isTodosLoading,
  } = useMonthTodos(hosId, currentMonth, activeFilter)

  // 선택된 날짜와 현재 보는 달이 동기화되도록 관리하여 "되감기" 버그 방지
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate))
    }
  }, [selectedDate, currentMonth])

  const [isMetaLoading, setIsMetaLoading] = useState(true)

  const refetch = () => {
    refetchNotices()
    refetchTodos()
  }

  useEffect(() => {
    const loadMetadata = async () => {
      setIsMetaLoading(true)
      try {
        const meta = await fetchHospitalMetadata(hosId)
        if (meta && 'users' in meta && 'groups' in meta) {
          setMetadata(meta as HospitalMetadata)
        }
      } catch (error) {
        console.error('Failed to load hospital metadata:', error)
      } finally {
        setIsMetaLoading(false)
      }
    }
    loadMetadata()
  }, [hosId])

  const isLoading = isNoticesLoading || isMetaLoading

  const filteredNotices = useMemo(() => {
    let result = noticesData

    // 0. 날짜 필터 적용
    // (시작일 <= 선택일) AND (종료일 >= 선택일 OR 종료일 IS NULL)
    const targetDate = startOfDay(selectedDate)
    result = result.filter((notice) => {
      const dates = notice.target_date as { start: string; end: string | null }
      if (!dates || !dates.start) return true // 데이터가 없으면 무조건 노출 (혹은 예외처리)

      const start = startOfDay(new Date(dates.start))
      const end = dates.end ? startOfDay(new Date(dates.end)) : null

      const isStarted = isBefore(start, targetDate) || isSameDay(start, targetDate)
      const isNotEnded = !end || isAfter(end, targetDate) || isSameDay(end, targetDate)

      return isStarted && isNotEnded
    })

    // 1. 공지 담당자 필터 적용
    if (selectedUserFilter.length > 0) {
      result = result.filter((notice) => {
        const targets = (notice.target_user || '').split(',').filter(Boolean)
        if (targets.length === 0) {
          return selectedUserFilter.includes('전체')
        }
        return (
          selectedUserFilter.includes('전체') ||
          targets.some((t) => selectedUserFilter.includes(t))
        )
      })
    }

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

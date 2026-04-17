'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Layers } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import TodoList from './todo-list'
import { ClientTodo } from '@/types/hospital/todo'
import { useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ko } from 'date-fns/locale'
import { HospitalMetadata } from './todo'

type Props = {
  hosId: string
  loggedInUserId: string
  activeFilter: 'all' | 'done' | 'not-done'
  todosByDate: Record<string, ClientTodo[]>
  selectedUserFilter: string[] // 필터 기준 추가
  refetch: () => Promise<void>
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
  metadata: HospitalMetadata
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

export default function TodoMobile({
  hosId,
  loggedInUserId,
  activeFilter,
  todosByDate,
  selectedUserFilter,
  refetch,
  currentMonth,
  setCurrentMonth,
  metadata,
  selectedDate,
  setSelectedDate,
}: Props) {
  
  const { matchingTodos, remainingTodos } = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const allTodayTodos = todosByDate[dateStr] || []
    
    // 1. 접근 가능한 Todo만 추출 (Tier 1 visibility)
    const accessibleTodos = allTodayTodos.filter(todo => {
      const targets = (todo.target_user || '').split(',').filter(Boolean)
      const isCreator = todo.user_id === loggedInUserId
      const currentUser = metadata.users.find(u => u.user_id === loggedInUserId)
      const isMaster = currentUser?.is_admin === true
      const isUnassigned = targets.length === 0
      const targetedGroups = targets.filter(t => metadata.groups.includes(t))

      if (isCreator || isUnassigned || targets.includes(loggedInUserId || '')) {
        return true
      }
      
      const myGroups = currentUser?.group || []
      const isTargetedAtMyGroup = targetedGroups.some(g => myGroups.includes(g))
      
      if (isTargetedAtMyGroup) return true
      if (isMaster && targetedGroups.length > 0) return true
      
      return false
    })

    // 2. 필터가 없는 경우 모든 접근 가능한 항목을 matching 처리
    if (selectedUserFilter.length === 0) {
      return { matchingTodos: accessibleTodos, remainingTodos: [] }
    }

    const filterIds = selectedUserFilter;
    const filterNames = selectedUserFilter
      .map(id => metadata.users.find(u => u.user_id === id)?.name)
      .filter(Boolean) as string[];

    const matching: ClientTodo[] = []
    const remaining: ClientTodo[] = []

    accessibleTodos.forEach(todo => {
      const targets = (todo.target_user || '').split(',').filter(Boolean)
      const isCreator = todo.user_id === loggedInUserId
      const isUnassigned = targets.length === 0

      // A. 담당자/유저/그룹 필터 확인
      const isUserMatch = targets.some(t => filterIds.includes(t) || filterNames.includes(t))
      
      // B. 미지정 필터 확인
      const isUnassignedMatch = isUnassigned && (selectedUserFilter.includes('미정') || selectedUserFilter.includes('미지정'))

      // C. 내가 작성한 글 필터 확인
      const isCreatedByMeMatch = selectedUserFilter.includes('__created_by_me__') && isCreator
      
      if (isUserMatch || isUnassignedMatch || isCreatedByMeMatch) {
        matching.push(todo)
      } else {
        remaining.push(todo)
      }
    })

    return { matchingTodos: matching, remainingTodos: remaining }
  }, [selectedDate, todosByDate, selectedUserFilter, metadata.users, metadata.groups, loggedInUserId])

  return (
    <div className="flex flex-col gap-4">
      {/* 날짜 핸들러 (상단 내비게이션) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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
            <div className="flex flex-col items-center cursor-pointer hover:bg-slate-50 rounded-md px-4 py-1.5 transition-all border border-transparent hover:border-slate-200">
              <span className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {format(selectedDate, 'yyyy. MM. dd')}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                 {format(selectedDate, 'EEEE', { locale: ko })}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 shadow-xl border-slate-200" align="center">
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

      {/* 필터 적용된 TODO 목록 (또는 전체 목록) */}
      <div className="min-h-[100px]">
        <h5 className="text-[11px] font-bold text-slate-400 mb-3 px-1 uppercase tracking-widest flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            {selectedUserFilter.length > 0 ? 'FILTERED TASKS' : 'DAILY TASKS'}
          </span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">
            {matchingTodos.length}
          </span>
        </h5>
        
        {matchingTodos.length > 0 ? (
          <TodoList
            date={selectedDate}
            todos={matchingTodos}
            hosId={hosId}
            loggedInUserId={loggedInUserId}
            refetch={refetch}
            activeFilter={activeFilter}
            metadata={metadata}
          />
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground border-2 border-dashed rounded-md">
            검색 조건에 맞는 할 일이 없습니다.
          </div>
        )}
      </div>

      {/* 필터 외 나머지 TODO 목록 (필터가 있을 때만 노출) */}
      {selectedUserFilter.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-6">
          <h5 className="text-[11px] font-bold text-slate-400 mb-3 px-1 uppercase tracking-widest flex items-center justify-between">
            <span className="flex items-center gap-1.5 opacity-60">
              <Layers className="h-3 w-3" />
              OTHER TASKS
            </span>
            <span className="text-[10px] bg-slate-50 px-1.5 py-0.5 rounded-full text-slate-400">
              {remainingTodos.length}
            </span>
          </h5>
          
          <div className="opacity-70">
            <TodoList
                date={selectedDate}
                todos={remainingTodos}
                hosId={hosId}
                loggedInUserId={loggedInUserId}
                refetch={refetch}
                activeFilter={activeFilter}
                metadata={metadata}
              />
          </div>
        </div>
      )}
    </div>
  )
}

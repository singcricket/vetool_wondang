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
    
    // 필터가 없는 경우 모든 항목을 matching 처리함
    if (selectedUserFilter.length === 0) {
      return { matchingTodos: allTodayTodos, remainingTodos: [] }
    }

    const matching: ClientTodo[] = []
    const remaining: ClientTodo[] = []

    allTodayTodos.forEach(todo => {
      const targets = (todo.target_user || '').split(',').filter(Boolean)
      
      // 담당자가 없으면(targets.length === 0) '전체' 필터가 켜져있을 때 매칭
      const isUnassignedMatch = targets.length === 0 && selectedUserFilter.includes('전체')
      const isUserMatch = targets.some(t => selectedUserFilter.includes(t))
      
      if (isUnassignedMatch || isUserMatch) matching.push(todo)
      else remaining.push(todo)
    })

    return { matchingTodos: matching, remainingTodos: remaining }
  }, [selectedDate, todosByDate, selectedUserFilter])

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

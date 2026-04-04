'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import TodoFilter from './todo-filter'
import TodoCalendar from './todo-calendar'
import UpsertTodoDialog from './upsert-todo-dialog'
import { useMonthTodos } from '@/hooks/use-month-todo'
import TodoMobile from './todo-mobile'
import { fetchHospitalMetadata } from '@/lib/services/hospital-home/todo'
import TodoUserFilter from './todo-user-filter'
import { ClientTodo } from '@/types/hospital/todo'
import { isSameMonth, startOfMonth } from 'date-fns'

export type HospitalMetadata = {
  users: {
    user_id: string
    name: string
    avatar_url: string | null
    position: string
    group: string[] | null
    is_vet: boolean
  }[]
  groups: string[]
}

type TodoProps = {
  hosId: string
  activeFilter: 'all' | 'done' | 'not-done'
  setActiveFilter: Dispatch<SetStateAction<'all' | 'done' | 'not-done'>>
  selectedUserFilter: string[]
  setSelectedUserFilter: Dispatch<SetStateAction<string[]>>
}

export default function Todo({
  hosId,
  activeFilter,
  setActiveFilter,
  selectedUserFilter,
  setSelectedUserFilter,
}: TodoProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [metadata, setMetadata] = useState<HospitalMetadata>({
    users: [],
    groups: [],
  })

  // 날짜 선택 상태를 부모에서 관리하여 달력과 리스트를 동기화함
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    if (!hosId) return

    const loadMetadata = async () => {
      try {
        const data = await fetchHospitalMetadata(hosId)
        if (data && 'users' in data && 'groups' in data) {
          setMetadata(data as HospitalMetadata)
        }
      } catch (error) {
        console.error('Failed to load hospital metadata:', error)
      }
    }

    loadMetadata()
  }, [hosId])

  const { todosByDate, refetch, isFetching } = useMonthTodos(
    hosId,
    currentMonth,
    activeFilter,
  )

  // 선택된 날짜와 현재 보는 달이 동기화되도록 관리하여 "되감기" 버그 방지
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate))
    }
  }, [selectedDate])

  const filteredTodosByDate = useMemo(() => {
    if (selectedUserFilter.length === 0) return todosByDate

    const result: Record<string, ClientTodo[]> = {}
    Object.entries(todosByDate).forEach(([date, todos]) => {
      result[date] = todos.filter((todo) => {
        const targets = (todo.target_user || '').split(',').filter(Boolean)
        
        // 담당자가 없는 경우 '미지정' 필터가 켜져 있으면 포함
        if (targets.length === 0) {
          return selectedUserFilter.includes('미정') || selectedUserFilter.includes('미지정')
        }
        
        // 특정 담당자와 매칭되는지 확인
        return targets.some((t) => selectedUserFilter.includes(t))
      })
    })
    return result
  }, [todosByDate, selectedUserFilter])

  return (
    <Card className="w-full rounded-sm border-none shadow-none bg-transparent">
      <CardHeader className="p-4 bg-white rounded-t-sm border shadow-sm mb-4">
        <CardTitle>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-lg">
              <h4 className="font-bold text-slate-800">📋 TODO Dashboard</h4>
              <UpsertTodoDialog
                hosId={hosId}
                date={selectedDate} // 현재 선택된 날짜에 추가되도록 설정
                refetch={refetch}
                metadata={metadata}
              />
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
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 달력 영역: 모바일에서는 숨김, 테블릿/PC에서만 노출 */}
          <div className="hidden sm:block flex-[3] bg-white p-4 rounded-sm border shadow-sm">
            <TodoCalendar
              hosId={hosId}
              activeFilter={activeFilter}
              todosByDate={filteredTodosByDate}
              refetch={refetch}
              isFetching={isFetching}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              metadata={metadata}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>

          {/* 일일 리스트 영역: 모바일 전용이면서 테블릿/PC에서는 우측 사이드바 역할을 수행 */}
          <div className="flex-[1.2] bg-white p-4 rounded-sm border shadow-sm min-w-[320px]">
             <TodoMobile
                hosId={hosId}
                activeFilter={activeFilter}
                todosByDate={todosByDate} 
                selectedUserFilter={selectedUserFilter}
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

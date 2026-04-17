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
    is_admin: boolean
  }[]
  groups: string[]
  master_user_id: string
}

type TodoProps = {
  hosId: string
  metadata: HospitalMetadata
  loggedInUserId: string
  activeFilter: 'all' | 'done' | 'not-done'
  setActiveFilter: Dispatch<SetStateAction<'all' | 'done' | 'not-done'>>
  selectedUserFilter: string[]
  setSelectedUserFilter: Dispatch<SetStateAction<string[]>>
}

export default function Todo({
  hosId,
  metadata,
  loggedInUserId,
  activeFilter,
  setActiveFilter,
  selectedUserFilter,
  setSelectedUserFilter,
}: TodoProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // 날짜 선택 상태를 부모에서 관리하여 달력과 리스트를 동기화함
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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
    const filterIds = selectedUserFilter;
    const filterNames = selectedUserFilter
      .map(id => metadata.users.find(u => u.user_id === id)?.name)
      .filter(Boolean) as string[];

      const result: Record<string, ClientTodo[]> = {}
      Object.entries(todosByDate).forEach(([date, todos]) => {
        result[date] = todos.filter((todo) => {
          const targets = (todo.target_user || '').split(',').filter(Boolean)
          const isCreator = todo.user_id === loggedInUserId
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
              // 마스터는 '그룹'이 하나라도 포함된 경우 모든 그룹 메시지 열람 가능
              isAccessible = true
            }
          }

        if (!isAccessible) return false

        // --- 2. UI 필터링 체크 (UI Filter Logic) ---
        if (selectedUserFilter.length === 0) return true

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
    })
    return result
  }, [todosByDate, selectedUserFilter, metadata.users, loggedInUserId])

  return (
    <Card className="w-full rounded-sm border-none shadow-none bg-transparent">
      <CardHeader className="p-4 bg-white rounded-t-sm border shadow-sm mb-4">
        <CardTitle>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-lg">
              <h4 className="font-bold text-slate-800">📋 TODO Dashboard</h4>
              <UpsertTodoDialog
                hosId={hosId}
                loggedInUserId={loggedInUserId}
                date={selectedDate} // 현재 선택된 날짜에 추가되도록 설정
                refetch={refetch}
                metadata={metadata}
              />
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
                loggedInUserId={loggedInUserId}
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

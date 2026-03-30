import { fetchMonthTodos } from '@/lib/services/hospital-home/todo'
import type { ClientTodo } from '@/types/hospital/todo'
import { format } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const useMonthTodos = (
  hosId: string,
  currentMonth: Date,
  activeFilter: 'all' | 'done' | 'not-done',
) => {
  const [isFetching, setIsFetching] = useState(true)
  const [todos, setTodos] = useState<ClientTodo[]>([])

  const monthKey = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth])

  const getTodos = useCallback(async () => {
    setIsFetching(true)
    const dateString = format(currentMonth, 'yyyy-MM-dd')
    const todosData = await fetchMonthTodos(hosId, dateString, activeFilter)
    setTodos(todosData)
    setIsFetching(false)
  }, [activeFilter, hosId, currentMonth])

  useEffect(() => {
    getTodos()
  }, [getTodos])

  // 리얼타임 구독
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`todos_realtime_${hosId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `hos_id=eq.${hosId}`,
        },
        () => {
          // 데이터 변경 시 전체 다시 가져오기
          getTodos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hosId, getTodos])

  const todosByDate = useMemo(() => {
    return todos.reduce(
      (acc, todo) => {
        const date = todo.target_date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(todo)
        return acc
      },
      {} as Record<string, ClientTodo[]>,
    )
  }, [todos])

  return { todos, todosByDate, isFetching, refetch: getTodos }
}

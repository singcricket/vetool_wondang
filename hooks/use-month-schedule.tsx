import { fetchMonthSchedules } from '@/lib/services/hospital-home/schedule'
import { Schedule } from '@/types/hospital/schedule'
import { format } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const useMonthSchedules = (hosId: string, currentMonth: Date) => {
  const [isFetching, setIsFetching] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const getSchedules = useCallback(async () => {
    if (!hosId) return
    setIsFetching(true)
    const dateString = format(currentMonth, 'yyyy-MM-dd')
    const data = await fetchMonthSchedules(hosId, dateString)
    setSchedules(data as Schedule[])
    setIsFetching(false)
  }, [hosId, currentMonth])

  useEffect(() => {
    getSchedules()
  }, [getSchedules])

  // 리얼타임 구독
  useEffect(() => {
    if (!hosId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`schedules_realtime_${hosId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `hos_id=eq.${hosId}`,
        },
        () => {
          getSchedules()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hosId, getSchedules])

  const schedulesByDate = useMemo(() => {
    return schedules.reduce(
      (acc, schedule) => {
        const date = format(new Date(schedule.start_time), 'yyyy-MM-dd')
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(schedule)
        return acc
      },
      {} as Record<string, Schedule[]>,
    )
  }, [schedules])

  return { schedules, schedulesByDate, isFetching, refetch: getSchedules }
}

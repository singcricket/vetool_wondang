'use server'

import { createClient } from '@/lib/supabase/server'
import { NewSchedule } from '@/types/hospital/schedule'
import { redirect } from 'next/navigation'

export const upsertSchedule = async (
  schedule: NewSchedule & { id?: string },
) => {
  const supabase = await createClient()

  const { error } = await supabase.from('schedules').upsert({
    ...schedule,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('upsertSchedule error:', error)
    redirect(`/error?message=${error.message}`)
  }
}

export const deleteSchedule = async (id: string, hosId: string) => {
  const supabase = await createClient()
  const { error } = await supabase
    .from('schedules')
    .delete()
    .match({ id, hos_id: hosId })

  if (error) {
    console.error('deleteSchedule error:', error)
    redirect(`/error?message=${error.message}`)
  }
}

export const fetchMonthSchedules = async (hosId: string, date: string) => {
  const supabase = await createClient()

  // 해당 월의 시작일부터 마지막날까지 가져오기
  const startDate = new Date(date)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1)
  // 넉넉하게 앞뒤로 일주일 정도 더 가져오면 달력 UI에서 편리함
  const queryStart = new Date(startDate)
  queryStart.setDate(queryStart.getDate() - 7)
  const queryEnd = new Date(endDate)
  queryEnd.setDate(queryEnd.getDate() + 7)

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('hos_id', hosId)
    .gte('start_time', queryStart.toISOString())
    .lte('start_time', queryEnd.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('fetchMonthSchedules error:', error)
    return []
  }

  return data
}

export const fetchSchedulesByDateRange = async (hosId: string, startDateIso: string, endDateIso: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('hos_id', hosId)
    .gte('start_time', startDateIso)
    .lte('start_time', endDateIso)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('fetchSchedulesByDateRange error:', error)
    return []
  }

  return data
}

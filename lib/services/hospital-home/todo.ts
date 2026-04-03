'use server'

import { createClient } from '@/lib/supabase/server'
import { getConsecutiveDays } from '@/lib/utils/utils'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { redirect } from 'next/navigation'

export const fetchTodos = async (
  hosId: string,
  selectedDate: Date,
  activeFilter: 'all' | 'done' | 'not-done',
) => {
  const supabase = await createClient()
  const { dayBefore, seletctedDay, dayAfter } = getConsecutiveDays(selectedDate)

  let query = supabase
    .from('todos')
    .select('id, is_done, target_date, target_user, todo_title')
    .match({ hos_id: hosId })
    .in('target_date', [dayBefore, seletctedDay, dayAfter])

  if (activeFilter === 'done') {
    query = query.eq('is_done', true)
  } else if (activeFilter === 'not-done') {
    query = query.eq('is_done', false)
  }

  const { data, error } = await query.order('created_at')

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }

  return {
    dayBeforTodos: data.filter((todo) => todo.target_date === dayBefore),
    seletctedDayTodos: data.filter((todo) => todo.target_date === seletctedDay),
    dayAfterTodos: data.filter((todo) => todo.target_date === dayAfter),
  }
}

export const fetchMonthTodos = async (
  hosId: string,
  selectedDate: string,
  activeFilter: 'all' | 'done' | 'not-done',
) => {
  const supabase = await createClient()
  const refDate = new Date(selectedDate)
  const start = format(startOfMonth(refDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(refDate), 'yyyy-MM-dd')

  let query = supabase
    .from('todos')
    .select('id, is_done, target_date, target_user, todo_title')
    .match({ hos_id: hosId })
    .gte('target_date', start)
    .lte('target_date', end)

  if (activeFilter === 'done') {
    query = query.eq('is_done', true)
  } else if (activeFilter === 'not-done') {
    query = query.eq('is_done', false)
  }

  const { data, error } = await query.order('created_at')

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }

  return data
}

export const upsertTodo = async (
  todo_title_input: string,
  target_user_input: string | undefined,
  date: string,
  hosId: string,
  id?: string,
) => {
  const supabase = await createClient()

  const { error } = await supabase.from('todos').upsert({
    todo_title: todo_title_input,
    hos_id: hosId,
    target_user: target_user_input,
    target_date: date,
    id,
  })

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}

export const toggleIsDone = async (todoId: string, isDone: boolean) => {
  const supabase = await createClient()
  const { error } = await supabase
    .from('todos')
    .update({
      is_done: !isDone,
    })
    .match({ id: todoId })

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}

export const deleteTodo = async (todoId: string) => {
  const supabase = await createClient()
  const { error } = await supabase.from('todos').delete().match({ id: todoId })

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}

export const fetchHospitalMetadata = async (hosId: string) => {
  const supabase = await createClient()

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, name, avatar_url, position, group, is_vet')
    .eq('hos_id', hosId)

  if (usersError) {
    console.error('fetchHospitalMetadata users error:', usersError)
    throw new Error(usersError.message)
  }

  const { data: hospital, error: hospitalError } = await supabase
    .from('hospitals')
    .select('group_list, schedule_setting')
    .eq('hos_id', hosId)
    .single()

  if (hospitalError) {
    console.error('fetchHospitalMetadata hospitals error:', hospitalError)
    throw new Error(hospitalError.message)
  }

  const additionalStaffs =
    (hospital?.schedule_setting as any)?.additional_staffs || []
  const formattedAdditionalUsers = additionalStaffs.map((staff: any) => ({
    user_id: `additional-${staff.name}`,
    name: staff.name,
    avatar_url: null,
    position: staff.position,
    group: [staff.group],
    is_vet: false,
  }))

  return {
    users: [...(users || []), ...formattedAdditionalUsers],
    groups: (hospital?.group_list as string[]) || [],
  }
}

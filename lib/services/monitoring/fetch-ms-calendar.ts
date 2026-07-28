'use server'

import { createClient } from '@/lib/supabase/server'

export type CalendarSession = {
  session_id: string
  due_date: string | null
  session_title: string | null
  session_group: string[]
  start_time: string | null
  end_time: string | null
  patient: { name: string; patient_id: string } | null
}

export const fetchCalendarSessions = async (hosId: string): Promise<CalendarSession[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monitoring_sessions')
    .select('session_id, due_date, session_title, session_group, start_time, end_time, patient:patients(name, patient_id)')
    .eq('hos_id', hosId)
    .order('due_date', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((d) => ({
    ...d,
    session_group: (d.session_group as string[] | null) ?? [],
    patient: d.patient as { name: string; patient_id: string } | null,
    end_time: d.end_time ?? null,
  }))
}

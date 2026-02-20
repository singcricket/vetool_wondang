'use server'

import { createClient } from '@/lib/supabase/server'

export const startMsTime = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({ start_time: new Date().toISOString() })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const stopMsTime = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({ end_time: new Date().toISOString() })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const resetMsTime = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({ end_time: null, start_time: null })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

export const updateMsTime = async (
  sessionId: string,
  startTimeInput: string | null,
  endTimeInput: string | null,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      start_time: startTimeInput,
      end_time: endTimeInput,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return
  }
}

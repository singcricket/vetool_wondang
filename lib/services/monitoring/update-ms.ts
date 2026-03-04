'use server'

import { createClient } from '@/lib/supabase/server'
import { MsVetSub } from '@/types/monitoring/monitoring-type'

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

export const updateMsPatient = async (
  sessionId: string,
  patientId: string,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      patient_id: patientId,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const deleteMs = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .delete()
    .match({ session_id: sessionId })

  if (error) {
    console.error('Delete failed:', error.message)
    return false
  }

  return true
}

export const updateMsTitle = async (
  sessionId: string,
  title: string,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      session_title: title,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsVet = async (
  sessionId: string,
  vetInput: MsVetSub & { main_vet: string, primary_vet: string },
) => {
  const main =
    vetInput.main_vet === 'null' || vetInput.main_vet === ''
      ? null
      : vetInput.main_vet
  const primary =
    vetInput.primary_vet === 'null' || vetInput.primary_vet === ''
      ? null
      : vetInput.primary_vet
  const sub = {
    secondary: vetInput.secondary === 'null' || vetInput.secondary === ''
      ? ''
      : vetInput.secondary,
    anesthesia: vetInput.anesthesia === 'null' || vetInput.anesthesia === ''
      ? ''
      : vetInput.anesthesia,
    other: vetInput.other === 'null' || vetInput.other === ''
      ? ''
      : vetInput.other,
  }
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      vet_sub: sub,
      vet_main: main,
      vet_primary: primary,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsGroup = async (
  sessionId: string,
  groupList: string[],
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      session_group: groupList,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}

export const updateMsTag = async (
  sessionId: string,
  tag: string,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions')
    .update({
      user_tags: tag,
    })
    .match({ session_id: sessionId })

  if (error) {
    console.error('Update failed:', error.message)
    return false
  }

  return true
}
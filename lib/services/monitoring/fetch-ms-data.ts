'use server'

import { createClient } from '@/lib/supabase/server'
import { MonitoringSession, MsTemplate, Patient } from '@/types'
import { MsMemoTx, MsVetSub, VitalResults } from '@/types/monitoring/monitoring-type'
import { redirect } from 'next/navigation'

export type MonitoringSidebarData = Omit<
  MonitoringSession,
  'created_at' | 'hos_id' | 'patient_id' | 'due_date'
> & {
  patient: Pick<
    Patient,
    'name' | 'breed' | 'species' | 'patient_id' | 'birth' | 'hos_patient_id'
  > | null
} & {
  vet_sub: MsVetSub
  session_group: string[]
}

export const fetchMonitoringSidebarData = async (
  hosId: string,
  targetDate: string,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('fetch_monitoring_sidebar_data', {
    hos_id_input: hosId,
    due_date_input: targetDate,
  })

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }
  console.log('fetch sidebar data', data)
  return (data ?? []) as MonitoringSidebarData[]
}

export type MsPatient = Omit<
  Patient,
  'hos_id' | 'created_at'
> & {
  body_weight: string | null
  weight_measured_date: string | null
}

export type MsWithPatientWithWeight = Omit<
  MonitoringSession,
  | 'patient_id'
  | 'memo_tx'
  | 'vet_sub'
  | 'planned_vitals'
  | 'vital_results'
  | 'session_info'
> & {
  patient: MsPatient | null
  memo_tx : MsMemoTx
  vet_sub : MsVetSub
  session_group: string[]
  planned_vitals: string[] | null
  vital_results : VitalResults | null
  session_info : string[]
}

export type MsTemplateChart = Omit<
  MsTemplate,
  | 'memo_tx'
  | 'planned_vitals'
  | 'vital_results'
> & {
  memo_tx : MsMemoTx
  planned_vitals: string[] | null
  vital_results : VitalResults | null
}

export const fetchMsWithPatientWithWeight = async (
  sessionId: string,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('fetch_ms_with_patient_with_weight', {
      session_id_input: sessionId,
    })
    .single()

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
  console.log('fetch ms with patient with weight', data)

  return data as MsWithPatientWithWeight
}

export const getMsTemplates = async (
  hosId: string,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monitoring_sessions_template')
    .select('*')
    .eq('hos_id', hosId)
    .order('session_template_title', { ascending: false })
  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
  

  return data as MsTemplateChart[]
}

export type MonitoringSessionChart = Omit<
  MonitoringSession,
  | 'memo_tx'
  | 'vet_sub'
  | 'session_group'
  | 'planned_vitals'
  | 'vital_results'
> & {
  memo_tx : MsMemoTx
  vet_sub : MsVetSub
  session_group: string[]
  planned_vitals: string[] | null
  vital_results : VitalResults | null
}

export const getMonitoringSessions = async (
  hosId: string,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monitoring_sessions')
    .select('*')
    .eq('hos_id', hosId)
    .order('due_date', { ascending: false })
  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
  

  return data as MonitoringSessionChart[]
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { MonitoringSession, Patient } from '@/types'
import { MsMemoTx, MsVetSub } from '@/types/monitoring/monitoring-type'
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
> & {
  patient: MsPatient | null
  memo_tx : MsMemoTx
  vet_sub : MsVetSub
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

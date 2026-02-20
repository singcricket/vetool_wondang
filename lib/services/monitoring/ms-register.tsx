'use server'

import { createClient } from '@/lib/supabase/server'
import { getDaysSince } from "@/lib/utils/utils"
import { redirect } from 'next/navigation'


export const registerMonitoringSession = async (
  hosId: string,
  targetDate: string,
  patientId: string,
  birth: string,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monitoring_sessions')
    .insert({
      session_title: '',
      session_group: '내과',
      hos_id: hosId,
      age_in_days: getDaysSince(birth),
      patient_id: patientId,
      due_date: targetDate,
    })
    .select('session_id')
    .single()

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }

  return data.session_id
}

export const registerEmergencyMs = async (
  hosId: string,
  targetDate: string,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monitoring_sessions')
    .insert({
      session_title: '응급처치',
      session_group: '응급',
      hos_id: hosId,
      due_date: targetDate,
      start_time: new Date().toISOString(), 
    })
    .select('session_id')
    .single()

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }

  return data.session_id
}

export const updatePatientFromMonitoring = async (
  updatePatient: {
    birth: string
    breed: string
    gender: string
    hos_patient_id: string
    memo: string
    microchip_no: string
    name: string
    species: string
    owner_name: string
    hos_owner_id: string
    weight: string
  },
  patientId: string,
  isWeightChanged: boolean,
) => {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_patient_from_monitoring', {
    birth_input: updatePatient.birth,
    breed_input: updatePatient.breed,
    gender_input: updatePatient.gender,
    patient_id_input: patientId,
    memo_input: updatePatient.memo,
    microchip_no_input: updatePatient.microchip_no,
    name_input: updatePatient.name,
    species_input: updatePatient.species,
    owner_name_input: updatePatient.owner_name,
    hos_owner_id_input: updatePatient.hos_owner_id,
    hos_patient_id_input: updatePatient.hos_patient_id,
    is_weight_changed_input: isWeightChanged,
    weight_input: updatePatient.weight,
  })

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}




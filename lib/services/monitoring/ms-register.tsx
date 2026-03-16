'use server'

import { createClient } from '@/lib/supabase/server'
import { getDaysSince } from "@/lib/utils/utils"
import { MsMemo, VITAL_REFERENCE_DATA, VitalResults } from '@/types/monitoring/monitoring-type';
import { redirect } from 'next/navigation'
import { MsWithPatientWithWeight } from './fetch-ms-data';
import { format } from 'date-fns'

export const registerMonitoringSession = async (
  hosId: string,
  targetDate: string,
  patientId: string,
  birth: string,
  tags: string,
) => {
  const supabase = await createClient()

  const DEFAULT_VITALS : string[] = [];
VITAL_REFERENCE_DATA.map((db,i)=>{
  i<4 && DEFAULT_VITALS.push(db.vitalName)
})

  const { data, error } = await supabase
    .from('monitoring_sessions')
    .insert({
      session_title: '',
      session_group: ['내과'],
      hos_id: hosId,
      age_in_days: getDaysSince(birth),
      patient_id: patientId,
      due_date: targetDate,
      vet_main: null,
      vet_primary: null,
      planned_vitals: DEFAULT_VITALS,
      tags:tags
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
 const DEFAULT_VITALS : string[] = [];
VITAL_REFERENCE_DATA.map((db,i)=>{
  i<4 && DEFAULT_VITALS.push(db.vitalName)
})
  const { data, error } = await supabase
    .from('monitoring_sessions')
    .insert({
      session_title: '응급처치',
      session_group: ['응급'],
      hos_id: hosId,
      due_date: targetDate,
      start_time: new Date().toISOString(), 
      vet_main: null,
      vet_primary: null,
       planned_vitals: DEFAULT_VITALS,
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
  msData : MsWithPatientWithWeight | null
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
  if(msData){
    const pretag = msData.tags?.split('#')??[]
    let newtag =  ""
    for(let i = 0; i < pretag.length - 7; i++){
      if(pretag[i]!=="")  newtag += "#"+pretag[i]
    }
    newtag += "#"+updatePatient.hos_patient_id+"#"+updatePatient.hos_owner_id+"#"+updatePatient.name+"#"+updatePatient.species+"#"+updatePatient.breed+"#"+updatePatient.gender+"#"+getDaysSince(format(updatePatient.birth, 'yyyy-MM-dd'))
    const updatems = await supabase.from('monitoring_sessions').update({
        tags: newtag,
        age_in_days: getDaysSince(format(updatePatient.birth, 'yyyy-MM-dd')),
        
      }).match({session_id: msData.session_id})

      if (updatems.error) {
        console.error(updatems.error)
        redirect(`/error?message=${updatems.error.message}`)
      }
  }
 
}


export const createMsTemplateChart = async (
  hosId: string,
  template_name: string,
  template_comment: string,
  template_vital_rusults: VitalResults,
  template_memo_tx : MsMemo[],
  msData: MsWithPatientWithWeight,
) => {
  const supabase = await createClient()

  const { error } = await supabase.from('monitoring_sessions_template').insert({
    hos_id: hosId,
    session_template_title: template_name,
    session_comment: template_comment,
    vital_results: template_vital_rusults??[],
    planned_vitals : msData.planned_vitals??[],
    is_template: true,
    interval_setting : msData.interval_setting??0,
    memo_tx: template_memo_tx,
    memo_etc : msData.memo_etc
  }).select('session_template_id').single()

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}

type MsTemplatePayload = {
  session_template_title: string
  session_comment: string
  interval_setting: number
  planned_vitals: string[]
  vital_results: VitalResults
  memo_tx: MsMemo[]
}

export const insertMsTemplateChart = async (
  hosId: string,
  payload: MsTemplatePayload,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions_template')
    .insert({ ...payload, hos_id: hosId, is_template: true })

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}

export const updateMsTemplateChart = async (
  templateId: string,
  payload: MsTemplatePayload,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('monitoring_sessions_template')
    .update(payload)
    .eq('session_template_id', templateId)

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }
}

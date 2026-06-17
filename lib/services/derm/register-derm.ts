'use server'

import { createClient } from '@/lib/supabase/server'

export async function registerDermChart(params: {
  hosId: string
  patientId: string
  targetDate: string
  visitType?: 'initial' | 'followup'
}): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await (supabase as any)
    .from('derm_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: params.patientId,
      chart_date: params.targetDate,
      visit_type: params.visitType ?? 'initial',
      evaluator_id: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`피부과 차트 생성 실패: ${error.message}`)
  return data.id
}

export async function registerPatientAndDermChart(params: {
  hosId: string
  chartDate: string
  patient: {
    name: string
    species: string
    breed: string
    gender: string
    birth: string
    hos_patient_id: string
    owner_name?: string
    hos_owner_id?: string
  }
}): Promise<string> {
  const supabase = await createClient()

  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .insert({
      hos_id: params.hosId,
      name: params.patient.name,
      species: params.patient.species,
      breed: params.patient.breed,
      gender: params.patient.gender,
      birth: params.patient.birth,
      hos_patient_id: params.patient.hos_patient_id,
      owner_name: params.patient.owner_name ?? null,
      hos_owner_id: params.patient.hos_owner_id ?? null,
    })
    .select('patient_id')
    .single()

  if (patientError) throw new Error(`환자 등록 실패: ${patientError.message}`)

  const { data: { user } } = await supabase.auth.getUser()

  const { data: chartData, error: chartError } = await (supabase as any)
    .from('derm_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      chart_date: params.chartDate,
      visit_type: 'initial',
      evaluator_id: user?.id ?? null,
    })
    .select('id')
    .single()

  if (chartError) throw new Error(`차트 생성 실패: ${chartError.message}`)
  return chartData.id
}

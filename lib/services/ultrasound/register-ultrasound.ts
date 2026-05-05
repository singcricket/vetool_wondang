'use server'

import { createClient } from '@/lib/supabase/server'

type UltrasoundRegisterData = {
  hosId: string
  targetDate: string
  patientId: string
  vetId: string | null
}

export async function registerUltrasoundChart(data: UltrasoundRegisterData) {
  const supabase = await createClient()

  // 1. 차트 기본 정보 저장
  const { data: chartData, error: chartError } = await supabase
    .from('ultrasound_charts')
    .insert({
      hos_id: data.hosId,
      patient_id: data.patientId,
      chart_date: data.targetDate,
      vet_id: data.vetId,
    })
    .select('id')
    .single()

  if (chartError) {
    console.error('registerUltrasoundChart - chart insert error:', chartError)
    throw new Error('차트 생성에 실패했습니다.')
  }

  return chartData.id
}

// 신규 환자 등록 후 차트 생성
export async function registerPatientAndUltrasoundChart(params: {
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
    .select(
      'patient_id, hos_patient_id, hos_owner_id, name, species, breed, gender, birth',
    )
    .single()

  if (patientError) {
    console.error(patientError)
    throw new Error(`환자 등록 실패: ${patientError.message}`)
  }

  const { data: chartData, error: chartError } = await supabase
    .from('ultrasound_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      chart_date: params.chartDate,
    })
    .select('id')
    .single()

  if (chartError) {
    console.error(chartError)
    throw new Error(`차트 생성 실패: ${chartError.message}`)
  }

  return chartData.id
}

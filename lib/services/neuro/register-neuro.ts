'use server'

import { createClient } from '@/lib/supabase/server'

interface RegisterNeuroChartProps {
  hosId: string
  patientId: string
  targetDate: string
  evaluatorId?: string | null
}

export async function registerNeuroChart({
  hosId,
  patientId,
  targetDate,
  evaluatorId = null,
}: RegisterNeuroChartProps) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('neuro_charts')
    .insert([
      {
        hos_id: hosId,
        patient_id: patientId,
        chart_date: targetDate,
        evaluator_id: evaluatorId,
      },
    ])
    .select('id')
    .single()

  if (error) {
    throw new Error(`차트 생성에 실패했습니다: ${error.message}`)
  }

  return data.id
}

// 신규 환자 등록 후 신경계 차트 생성
export async function registerPatientAndNeuroChart(params: {
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

  // 1. 환자 등록
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

  if (patientError) {
    console.error(patientError)
    throw new Error(`환자 등록 실패: ${patientError.message}`)
  }

  // 2. 신경계 차트 생성
  const { data: { user } } = await supabase.auth.getUser()

  const { data: chartData, error: chartError } = await supabase
    .from('neuro_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      chart_date: params.chartDate,
      evaluator_id: user?.id ?? null,
    })
    .select('id')
    .single()

  if (chartError) {
    console.error(chartError)
    throw new Error(`차트 생성 실패: ${chartError.message}`)
  }

  return chartData.id
}


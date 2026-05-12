'use server'

import { createClient } from '@/lib/supabase/server'

interface RegisterCytologyChartProps {
  hosId: string
  patientId: string
  targetDate: string
  evaluatorId?: string | null
}

export async function registerCytologyChart({
  hosId,
  patientId,
  targetDate,
  evaluatorId = null,
}: RegisterCytologyChartProps) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('cytology_charts')
    .insert([
      {
        hos_id: hosId,
        patient_id: patientId,
        chart_date: targetDate,
        evaluator_id: evaluatorId,
        sample_type: 'otic',
        mode: 'specialist',
      },
    ])
    .select('id')
    .single()

  if (error) throw new Error(`차트 생성에 실패했습니다: ${error.message}`)

  return data.id
}

export async function registerPatientAndCytologyChart(params: {
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

  const { data: chartData, error: chartError } = await (supabase as any)
    .from('cytology_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      chart_date: params.chartDate,
      sample_type: 'otic',
      mode: 'specialist',
    })
    .select('id')
    .single()

  if (chartError) throw new Error(`차트 생성 실패: ${chartError.message}`)

  return chartData.id
}

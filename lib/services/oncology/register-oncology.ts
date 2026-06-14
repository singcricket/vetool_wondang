'use server'

import { createClient } from '@/lib/supabase/server'

function normalizeDiagnosisKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '_')
    .trim()
}

interface RegisterOncologyCaseProps {
  hosId: string
  patientId: string
  targetDate: string
  diagnosisName: string
  vetId?: string | null
}

export async function registerOncologyCase({
  hosId,
  patientId,
  targetDate,
  diagnosisName,
  vetId = null,
}: RegisterOncologyCaseProps): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('onco_cases')
    .insert({
      hos_id: hosId,
      patient_id: patientId,
      case_date: targetDate,
      diagnosis_name: diagnosisName,
      diagnosis_key: normalizeDiagnosisKey(diagnosisName),
      vet_id: vetId,
      created_by: user?.id ?? null,
      diagnosis_category: [],
      diagnosis_method: [],
      status: 'active',
    })
    .select('id')
    .single()

  if (error) throw new Error(`케이스 생성에 실패했습니다: ${error.message}`)

  return data.id
}

export async function registerPatientAndOncologyCase(params: {
  hosId: string
  caseDate: string
  diagnosisName: string
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
  vetId?: string | null
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

  const { data: caseData, error: caseError } = await supabase
    .from('onco_cases')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      case_date: params.caseDate,
      diagnosis_name: params.diagnosisName,
      diagnosis_key: normalizeDiagnosisKey(params.diagnosisName),
      vet_id: params.vetId ?? null,
      created_by: user?.id ?? null,
      diagnosis_category: [],
      diagnosis_method: [],
      status: 'active',
    })
    .select('id')
    .single()

  if (caseError) throw new Error(`케이스 생성 실패: ${caseError.message}`)

  return caseData.id
}

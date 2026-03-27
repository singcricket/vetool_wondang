'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// =============================================
// tags 인코딩 (monitoring_sessions 패턴 동일)
// #hos_patient_id#hos_owner_id#name#species#breed#gender#age_days
// + user_tags 키워드 추가
// =============================================
function buildTags(
  patient: {
    hos_patient_id: string
    hos_owner_id: string | null
    name: string
    species: string
    breed: string
    gender: string
    birth: string
  },
  userTags: string,
): string {
  const ageDays = Math.floor(
    (Date.now() - new Date(patient.birth).getTime()) / (1000 * 60 * 60 * 24),
  )
  const base = `#${patient.hos_patient_id}#${patient.hos_owner_id ?? ''}#${patient.name}#${patient.species}#${patient.breed}#${patient.gender}#${ageDays}`
  if (!userTags.trim()) return base
  const keywords = userTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .join('#')
  return `${base}#${keywords}`
}

// =============================================
// 차트 생성 (기존 환자)
// =============================================
export async function registerEchoChart(params: {
  hosId: string
  patientId: string
  examDate: string
  vetId: string | null
  examinerId: string | null
  userTags: string
  patient: {
    hos_patient_id: string
    hos_owner_id: string | null
    name: string
    species: string
    breed: string
    gender: string
    birth: string
  }
}): Promise<string> {
  const supabase = await createClient()

  const tags = buildTags(params.patient, params.userTags)

  const { data, error } = await supabase
    .from('echo_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: params.patientId,
      exam_date: params.examDate,
      vet_id: params.vetId,
      examiner_id: params.examinerId,
      user_tags: params.userTags || null,
      tags,
    })
    .select('id')
    .single()

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }

  return data.id
}

// =============================================
// 신규 환자 등록 후 차트 생성
// =============================================
export async function registerPatientAndEchoChart(params: {
  hosId: string
  examDate: string
  vetId: string | null
  examinerId: string | null
  userTags: string
  patient: {
    name: string
    species: string
    breed: string
    gender: string
    birth: string
    hos_patient_id: string
    owner_name?: string
  }
}): Promise<string> {
  const supabase = await createClient()

  // 환자 등록
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
    })
    .select('patient_id, hos_patient_id, hos_owner_id, name, species, breed, gender, birth')
    .single()

  if (patientError) {
    console.error(patientError)
    redirect(`/error?message=${patientError.message}`)
  }

  // 차트 생성
  const tags = buildTags(
    {
      ...patientData,
      hos_owner_id: patientData.hos_owner_id ?? null,
    },
    params.userTags,
  )

  const { data: chartData, error: chartError } = await supabase
    .from('echo_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      exam_date: params.examDate,
      vet_id: params.vetId,
      examiner_id: params.examinerId,
      user_tags: params.userTags || null,
      tags,
    })
    .select('id')
    .single()

  if (chartError) {
    console.error(chartError)
    redirect(`/error?message=${chartError.message}`)
  }

  return chartData.id
}

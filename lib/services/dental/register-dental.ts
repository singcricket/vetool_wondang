'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { SupabaseClient } from '@supabase/supabase-js'

// =============================================
// tags 인코딩 (monitoring_sessions 패턴 동일)
// #hos_patient_id#hos_owner_id#name#species#breed#gender#age_days
// =============================================
function buildTags(patient: {
  hos_patient_id: string
  hos_owner_id: string | null
  name: string
  species: string
  breed: string
  gender: string
  birth: string
}): string {
  const ageDays = Math.floor(
    (Date.now() - new Date(patient.birth).getTime()) / (1000 * 60 * 60 * 24),
  )
  return `#${patient.hos_patient_id}#${patient.hos_owner_id ?? ''}#${patient.name}#${patient.species}#${patient.breed}#${patient.gender}#${ageDays}`
}

// =============================================
// 차트 생성 (기존 환자)
// =============================================
export async function registerDentalChart(params: {
  hosId: string
  patientId: string
  chartDate: string
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

  const tags = buildTags(params.patient)

  const { data, error } = await supabase
    .from('dental_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: params.patientId,
      chart_date: params.chartDate,
      tags,
    })
    .select('id')
    .single()

  if (error) {
    console.error(error)
    redirect(`/error?message=${error.message}`)
  }

  // 이전 차트 상태 계승
  await inheritPreviousTeeth(supabase, data.id, params.hosId, params.patientId)

  return data.id
}

// =============================================
// 이전 차트 치아 상태 계승 로직
// =============================================
async function inheritPreviousTeeth(supabase: SupabaseClient, newChartId: string, hosId: string, patientId: string) {
  // 1. 동일 환자의 직전 차트 조회 (가장 최근 것 1개)
  const { data: previousCharts } = await supabase
    .from('dental_charts')
    .select('id, chart_date')
    .eq('patient_id', patientId)
    .neq('id', newChartId) // 현재 차트 제외
    .order('chart_date', { ascending: false })
    .limit(1)
  
  if (!previousCharts || previousCharts.length === 0) return

  const prevChartId = previousCharts[0].id

  // 2. 직전 차트의 치아 기록 조회
  const { data: prevTeeth } = await supabase
    .from('dental_chart_teeth')
    .select('*')
    .eq('chart_id', prevChartId)
  
  if (!prevTeeth || prevTeeth.length === 0) return

  // 3. 계승할 치아 매핑
  const newTeeth = prevTeeth.reduce((acc: any[], prevTooth) => {
    const treatments = prevTooth.treatment_done || []
    // 발치 처치 여부 확인
    const hasExtraction = treatments.some((code: string) => 
      ['X', 'XS', 'XSS'].includes(code.toUpperCase())
    )
    
    if (hasExtraction) {
      // 4. 이전 차트에서 발치된 경우 -> 새 차트에 'FE'로 생성
      acc.push({
         chart_id: newChartId,
         hos_id: hosId,
         tooth_id: prevTooth.tooth_id,
         status: 'FE',
      })
    } else if (prevTooth.status && prevTooth.status !== 'present') {
      // 5, 6. status가 'present'가 아니고 발치도 안 됐다면, 이전 status 그대로 계승 ('FE', 'ANO', 'T/U' 등)
      acc.push({
         chart_id: newChartId,
         hos_id: hosId,
         tooth_id: prevTooth.tooth_id,
         status: prevTooth.status,
      })
    }
    return acc
  }, [])

  // 4. 일괄 추가
  if (newTeeth.length > 0) {
    const { error } = await supabase.from('dental_chart_teeth').insert(newTeeth)
    if (error) {
      console.error('Failed to inherit previous teeth:', error)
    }
  }
}

// =============================================
// 신규 환자 등록 후 차트 생성
// =============================================
export async function registerPatientAndDentalChart(params: {
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
    redirect(`/error?message=${patientError.message}`)
  }

  const tags = buildTags({
    ...patientData,
    hos_owner_id: patientData.hos_owner_id ?? null,
  })

  const { data: chartData, error: chartError } = await supabase
    .from('dental_charts')
    .insert({
      hos_id: params.hosId,
      patient_id: patientData.patient_id,
      chart_date: params.chartDate,
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

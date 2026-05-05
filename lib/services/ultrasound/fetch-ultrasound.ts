'use server'

import { createClient } from '@/lib/supabase/server'
import type { UltrasoundChartDetail } from '@/types/hospital/ultrasound-type'

export type UltrasoundSidebarItem = {
  id: string
  patient_id: string
  chart_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  vet_name: string | null
}

// =============================================
// 사이드바 차트 목록 조회 (날짜 기준)
// =============================================
export async function fetchUltrasoundSidebarData(
  hosId: string,
  targetDate: string,
): Promise<UltrasoundSidebarItem[]> {
  const supabase = await createClient()

  // 1. 차트 및 환자 정보 조회
  const { data: chartData, error: chartError } = await supabase
    .from('ultrasound_charts')
    .select(`
      id,
      patient_id,
      chart_date,
      vet_id,
      patients!inner(name, species, breed, hos_patient_id)
    `)
    .eq('hos_id', hosId)
    .eq('chart_date', targetDate)
    .order('created_at', { ascending: true })

  if (chartError) throw new Error(`fetchUltrasoundSidebarData: ${chartError.message}`)

  // 2. 병원의 수의사 목록 조회 (ID -> 이름 매핑용)
  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    
  const vetMap = new Map((vetData ?? []).map(v => [v.user_id, v.name]))

  return (chartData ?? []).map((row: any) => {
    const vetName = row.vet_id ? vetMap.get(row.vet_id) : null

    return {
      id: row.id,
      patient_id: row.patient_id,
      chart_date: row.chart_date,
      patient_name: row.patients?.name ?? '',
      species: row.patients?.species ?? '',
      breed: row.patients?.breed ?? '',
      hos_patient_id: row.patients?.hos_patient_id ?? '',
      vet_name: vetName ?? null,
    }
  })
}

// =============================================
// 전체 차트 목록 조회 (검색용)
// =============================================
export async function getUltrasoundCharts(
  hosId: string,
): Promise<UltrasoundChartDetail[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ultrasound_charts')
    .select(`
      *,
      patient:patients(*),
      evaluator:users!ultrasound_charts_evaluator_id_fkey(user_id, name),
      vet:users!ultrasound_charts_vet_id_fkey(user_id, name)
    `)
    .eq('hos_id', hosId)
    .order('chart_date', { ascending: false })

  if (error) throw new Error(`getUltrasoundCharts: ${error.message}`)

  return data as unknown as UltrasoundChartDetail[]
}

// =============================================
// 환자의 과거 차트 목록 조회
// =============================================
export async function fetchPatientUltrasoundHistory(
  patientId: string,
): Promise<{ id: string; chart_date: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ultrasound_charts')
    .select('id, chart_date')
    .eq('patient_id', patientId)
    .order('chart_date', { ascending: false })

  if (error) throw new Error(`fetchPatientUltrasoundHistory: ${error.message}`)

  return data ?? []
}

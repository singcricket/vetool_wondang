'use server'

import { createClient } from '@/lib/supabase/server'
import type { DentalSidebarItem, DentalChartWithPatient } from '@/types/dental/dental-type'

// =============================================
// 사이드바 차트 목록 조회 (날짜 기준)
// =============================================
export async function fetchDentalSidebarData(
  hosId: string,
  targetDate: string,
): Promise<DentalSidebarItem[]> {
  const supabase = await createClient()

  // 1. 차트 및 환자 정보 조회 (vet_id는 JSONB [{id, role}, ...] 형태)
  const { data: chartData, error: chartError } = await supabase
    .from('dental_charts')
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

  if (chartError) throw new Error(`fetchDentalSidebarData: ${chartError.message}`)

  // 2. 병원의 수의사 목록 조회 (ID -> 이름 매핑용)
  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    
  const vetMap = new Map((vetData ?? []).map(v => [v.user_id, v.name]))

  return (chartData ?? []).map((row: any) => {
    // vet_id JSON에서 role이 '담당의'인 객체 찾기
    const vetIdArray = Array.isArray(row.vet_id) ? row.vet_id : []
    const attendingVet = vetIdArray.find((v: any) => v.role === '담당의')
    const vetName = attendingVet ? vetMap.get(attendingVet.id) : null

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
export async function getDentalCharts(
  hosId: string,
): Promise<DentalChartWithPatient[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dental_charts')
    .select(
      `
      *,
      patient:patients(*)
    `,
    )
    .eq('hos_id', hosId)
    .order('chart_date', { ascending: false })

  if (error) throw new Error(`getDentalCharts: ${error.message}`)

  return data as unknown as DentalChartWithPatient[]
}

// =============================================
// 환자의 과거 차위 목록 조회
// =============================================
export async function fetchPatientDentalHistory(
  patientId: string,
): Promise<{ id: string; chart_date: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dental_charts')
    .select('id, chart_date')
    .eq('patient_id', patientId)
    .order('chart_date', { ascending: false })

  if (error) throw new Error(`fetchPatientDentalHistory: ${error.message}`)

  return data ?? []
}

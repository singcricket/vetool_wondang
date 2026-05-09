'use server'

import { createClient } from '@/lib/supabase/server'

export type NeuroSidebarItem = {
  id: string
  patient_id: string
  chart_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  evaluator_name: string | null
}

export async function fetchNeuroSidebarData(
  hosId: string,
  targetDate: string,
): Promise<NeuroSidebarItem[]> {
  const supabase = await createClient()

  // 1. 차트 및 환자 정보 조회
  const { data: chartData, error: chartError } = await supabase
    .from('neuro_charts')
    .select(`
      id,
      patient_id,
      chart_date,
      evaluator_id,
      patients!inner(name, species, breed, hos_patient_id)
    `)
    .eq('hos_id', hosId)
    .eq('chart_date', targetDate)
    .order('created_at', { ascending: true })

  if (chartError) throw new Error(`fetchNeuroSidebarData: ${chartError.message}`)

  // 2. 병원의 수의사(혹은 사용자) 목록 조회
  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    
  const userMap = new Map((vetData ?? []).map(v => [v.user_id, v.name]))

  return (chartData ?? []).map((row: any) => {
    const evaluatorName = row.evaluator_id ? userMap.get(row.evaluator_id) : null

    return {
      id: row.id,
      patient_id: row.patient_id,
      chart_date: row.chart_date,
      patient_name: row.patients?.name ?? '',
      species: row.patients?.species ?? '',
      breed: row.patients?.breed ?? '',
      hos_patient_id: row.patients?.hos_patient_id ?? '',
      evaluator_name: evaluatorName ?? null,
    }
  })
}

// 레이아웃 데이터 (수의사 목록 등)
export async function fetchNeuroLayoutData(hosId: string) {
  const supabase = await createClient()

  // 병원의 수의사 목록 가져오기
  const { data: vetData, error: vetError } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: false })

  if (vetError) throw new Error(`fetchNeuroLayoutData (vets): ${vetError.message}`)

  return {
    vetList: vetData ?? [],
  }
}

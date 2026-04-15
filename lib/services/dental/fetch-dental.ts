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

  const { data, error } = await supabase
    .from('dental_charts')
    .select(
      `
      id,
      patient_id,
      chart_date,
      vet_id,
      patients!inner(name, species, breed, hos_patient_id)
    `,
    )
    .eq('hos_id', hosId)
    .eq('chart_date', targetDate)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchDentalSidebarData: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patient_id: row.patient_id,
    chart_date: row.chart_date,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    vet_name: null,
  }))
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

'use server'

import { createClient } from '@/lib/supabase/server'
import type { DentalChartDetail, DentalTooth } from '@/types/dental/dental-type'

// ══════════════════════════════════════════════
// 차트 상세 조회 (dental_charts + patient join)
// ══════════════════════════════════════════════
export async function fetchDentalChartDetail(
  dentalId: string,
): Promise<DentalChartDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dental_charts')
    .select(
      `
      *,
      patient:patients(
        name, species, breed, hos_patient_id,
        birth, gender, owner_name, hos_owner_id,
        microchip_no, memo
      )
    `,
    )
    .eq('id', dentalId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`fetchDentalChartDetail: ${error.message}`)
  }

  return data as unknown as DentalChartDetail
}

// ══════════════════════════════════════════════
// 치아 목록 조회 (dental_chart_teeth)
// ══════════════════════════════════════════════
export async function fetchDentalChartTeeth(
  chartId: string,
): Promise<DentalTooth[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dental_chart_teeth')
    .select('*')
    .eq('chart_id', chartId)
    .order('tooth_id', { ascending: true })

  if (error) throw new Error(`fetchDentalChartTeeth: ${error.message}`)

  return (data ?? []) as unknown as DentalTooth[]
}

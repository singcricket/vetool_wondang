'use server'

import { createClient } from '@/lib/supabase/server'

export interface DermSidebarItem {
  id: string
  patient_id: string
  chart_date: string
  visit_type: 'initial' | 'followup'
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  overall_severity: number | null
}

export async function fetchDermSidebarData(
  hosId: string,
  targetDate: string,
): Promise<DermSidebarItem[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_charts')
    .select(`
      id,
      patient_id,
      chart_date,
      visit_type,
      overall_severity,
      patients!inner(name, species, breed, hos_patient_id)
    `)
    .eq('hos_id', hosId)
    .eq('chart_date', targetDate)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchDermSidebarData: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patient_id: row.patient_id,
    chart_date: row.chart_date,
    visit_type: row.visit_type,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    overall_severity: row.overall_severity ?? null,
  }))
}

export async function fetchDermLayoutData(hosId: string) {
  const supabase = await createClient()

  const { data: vetData, error: vetError } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: false })

  if (vetError) throw new Error(`fetchDermLayoutData: ${vetError.message}`)

  return { vetList: vetData ?? [] }
}

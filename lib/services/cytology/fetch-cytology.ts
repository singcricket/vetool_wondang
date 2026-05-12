'use server'

import { createClient } from '@/lib/supabase/server'

export type CytologySidebarItem = {
  id: string
  patient_id: string
  chart_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  evaluator_name: string | null
  sample_type: string
  mode: string
}

export async function fetchCytologySidebarData(
  hosId: string,
  targetDate: string,
): Promise<CytologySidebarItem[]> {
  const supabase = await createClient()

  const { data: chartData, error: chartError } = await (supabase as any)
    .from('cytology_charts')
    .select(`
      id,
      patient_id,
      chart_date,
      evaluator_id,
      sample_type,
      mode,
      patients!inner(name, species, breed, hos_patient_id)
    `)
    .eq('hos_id', hosId)
    .eq('chart_date', targetDate)
    .order('created_at', { ascending: true })

  if (chartError) throw new Error(`fetchCytologySidebarData: ${chartError.message}`)

  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)

  const userMap = new Map((vetData ?? []).map(v => [v.user_id, v.name]))

  return (chartData ?? []).map((row: any) => ({
    id: row.id,
    patient_id: row.patient_id,
    chart_date: row.chart_date,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    evaluator_name: row.evaluator_id ? (userMap.get(row.evaluator_id) ?? null) : null,
    sample_type: row.sample_type ?? '',
    mode: row.mode ?? 'specialist',
  }))
}

export async function fetchCytologyLayoutData(hosId: string) {
  const supabase = await createClient()

  const { data: vetData, error: vetError } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: false })

  if (vetError) throw new Error(`fetchCytologyLayoutData: ${vetError.message}`)

  return { vetList: vetData ?? [] }
}

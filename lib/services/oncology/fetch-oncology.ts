'use server'

import { createClient } from '@/lib/supabase/server'
import type { OncologySidebarItem, OncologyCaseDetail } from '@/types/hospital/oncology-type'

export async function fetchOncologySidebarData(
  hosId: string,
  targetDate: string,
): Promise<OncologySidebarItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('onco_cases')
    .select(`
      id,
      patient_id,
      case_date,
      diagnosis_name,
      status,
      vet_id,
      patients!inner(name, species, breed, hos_patient_id)
    `)
    .eq('hos_id', hosId)
    .eq('case_date', targetDate)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchOncologySidebarData: ${error.message}`)

  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)

  const vetMap = new Map((vetData ?? []).map((v) => [v.user_id, v.name]))

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patient_id: row.patient_id,
    case_date: row.case_date,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    diagnosis_name: row.diagnosis_name,
    status: row.status,
    vet_name: row.vet_id ? (vetMap.get(row.vet_id) ?? null) : null,
  }))
}

export async function getOncologyCases(
  hosId: string,
): Promise<OncologySidebarItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('onco_cases')
    .select(`
      id,
      patient_id,
      case_date,
      diagnosis_name,
      status,
      vet_id,
      patients!inner(name, species, breed, hos_patient_id)
    `)
    .eq('hos_id', hosId)
    .order('case_date', { ascending: false })

  if (error) throw new Error(`getOncologyCases: ${error.message}`)

  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)

  const vetMap = new Map((vetData ?? []).map((v) => [v.user_id, v.name]))

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patient_id: row.patient_id,
    case_date: row.case_date,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    diagnosis_name: row.diagnosis_name,
    status: row.status,
    vet_name: row.vet_id ? (vetMap.get(row.vet_id) ?? null) : null,
  }))
}

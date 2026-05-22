'use server'

import { createClient } from '@/lib/supabase/server'
import type { CheckupSidebarItem, CheckupDetail, CheckupSection, CheckupAiResult } from '@/types/hospital/checkup-type'

const RECORD_SELECT = `
  id,
  patient_id,
  checkup_date,
  status,
  vet_id,
  created_at,
  patients!inner(name, species, breed, hos_patient_id)
`

export async function fetchCheckupSidebarData(
  hosId: string,
  targetDate: string,
): Promise<CheckupSidebarItem[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('checkup_records')
    .select(RECORD_SELECT)
    .eq('hos_id', hosId)
    .eq('checkup_date', targetDate)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchCheckupSidebarData: ${error.message}`)

  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)

  const vetMap = new Map((vetData ?? []).map((v) => [v.user_id, v.name]))

  return (data ?? []).map((row: any): CheckupSidebarItem => ({
    id: row.id,
    patient_id: row.patient_id,
    checkup_date: row.checkup_date,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    status: row.status,
    vet_name: row.vet_id ? (vetMap.get(row.vet_id) ?? null) : null,
  }))
}

export async function fetchCheckupDetail(checkupId: string): Promise<CheckupDetail> {
  const supabase = await createClient()

  const { data: record, error: recordError } = await (supabase as any)
    .from('checkup_records')
    .select(`
      id, hos_id, patient_id, checkup_date, status, vet_id, notes, sub_charts,
      patients!inner(name, species, breed, hos_patient_id, birth, gender, owner_name)
    `)
    .eq('id', checkupId)
    .single()

  if (recordError) throw new Error(`fetchCheckupDetail: ${recordError.message}`)

  const { data: sections } = await supabase
    .from('checkup_sections')
    .select('*')
    .eq('checkup_id', checkupId)

  const { data: aiResult } = await supabase
    .from('checkup_ai_results')
    .select('*')
    .eq('checkup_id', checkupId)
    .single()

  let vetName: string | null = null
  if (record.vet_id) {
    const { data: vetData } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', record.vet_id)
      .single()
    vetName = vetData?.name ?? null
  }

  const p = record.patients

  return {
    record: {
      id: record.id,
      hos_id: record.hos_id,
      patient_id: record.patient_id,
      checkup_date: record.checkup_date,
      status: record.status,
      vet_id: record.vet_id,
      notes: record.notes,
      sub_charts: (record.sub_charts as Record<string, string | null>) ?? {},
      patient: {
        name: p?.name ?? '',
        species: p?.species ?? '',
        breed: p?.breed ?? '',
        hos_patient_id: p?.hos_patient_id ?? '',
        birth: p?.birth ?? null,
        gender: p?.gender ?? null,
        owner_name: p?.owner_name ?? null,
      },
      vet_name: vetName,
    },
    sections: (sections ?? []) as CheckupSection[],
    aiResult: aiResult
      ? {
          ...aiResult,
          abnormal_findings: (aiResult.abnormal_findings as any[]) ?? [],
          monitoring_items: (aiResult.monitoring_items as any[]) ?? [],
        }
      : null,
  }
}

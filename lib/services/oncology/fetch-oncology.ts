'use server'

import { createClient } from '@/lib/supabase/server'
import type { OncologySidebarItem, OncologyCaseDetail } from '@/types/hospital/oncology-type'

const CASE_SELECT = `
  id,
  patient_id,
  case_date,
  diagnosis_name,
  status,
  vet_id,
  created_at,
  patients!inner(name, species, breed, hos_patient_id)
`

export async function fetchOncologySidebarData(
  hosId: string,
  targetDate: string,
): Promise<OncologySidebarItem[]> {
  const supabase = await createClient()

  // ① case_date 일치
  const { data: caseDateRows, error } = await (supabase as any)
    .from('onco_cases')
    .select(CASE_SELECT)
    .eq('hos_id', hosId)
    .eq('case_date', targetDate)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchOncologySidebarData: ${error.message}`)

  // ② scheduled_date 일치 — schedules → case_protocols → case_id
  const { data: scheduleRows } = await (supabase as any)
    .from('onco_schedules')
    .select('drug_name, onco_case_protocols!inner(case_id)')
    .eq('scheduled_date', targetDate)

  // case_id → drug_names 맵
  const drugMap: Record<string, string[]> = {}
  for (const s of scheduleRows ?? []) {
    const caseId = s.onco_case_protocols?.case_id
    if (!caseId) continue
    if (!drugMap[caseId]) drugMap[caseId] = []
    if (s.drug_name && !drugMap[caseId].includes(s.drug_name)) {
      drugMap[caseId].push(s.drug_name)
    }
  }

  const scheduleCaseIds = Object.keys(drugMap)

  // 스케줄 케이스 중 case_date 매칭과 겹치지 않는 것만 추가로 fetch
  const caseDateIdSet = new Set<string>((caseDateRows ?? []).map((r: any) => r.id))
  const extraIds = scheduleCaseIds.filter((id) => !caseDateIdSet.has(id))

  let extraRows: any[] = []
  if (extraIds.length > 0) {
    const { data: extra } = await (supabase as any)
      .from('onco_cases')
      .select(CASE_SELECT)
      .eq('hos_id', hosId)
      .in('id', extraIds)
      .order('created_at', { ascending: true })
    extraRows = extra ?? []
  }

  // ③ 담당의 맵
  const { data: vetData } = await supabase
    .from('users')
    .select('user_id, name')
    .eq('hos_id', hosId)
    .eq('is_vet', true)

  const vetMap = new Map((vetData ?? []).map((v) => [v.user_id, v.name]))

  const toItem = (row: any, matchType: OncologySidebarItem['matchType']): OncologySidebarItem => ({
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
    matchType,
    scheduledDrugs: drugMap[row.id] ?? [],
  })

  const results: OncologySidebarItem[] = [
    ...(caseDateRows ?? []).map((row: any) =>
      toItem(row, scheduleCaseIds.includes(row.id) ? 'both' : 'case_date')
    ),
    ...extraRows.map((row: any) => toItem(row, 'schedule_date')),
  ]

  return results
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
    matchType: 'case_date' as const,
    scheduledDrugs: [],
  }))
}

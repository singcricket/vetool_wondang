'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { QolBehaviorChecklist, OncologyQolRecordRow } from '@/lib/services/oncology/fetch-oncology-case'

export interface QolRecordData {
  case_id: string
  visit_date: string
  body_weight?: number | null
  pain_score?: number | null
  hunger_score?: number | null
  hydration_score?: number | null
  hygiene_score?: number | null
  happiness_score?: number | null
  mobility_score?: number | null
  good_days_score?: number | null
  nausea_vomiting_days?: number | null
  lethargy_days?: number | null
  behavior_checklist?: QolBehaviorChecklist | null
  reported_by?: 'vet' | 'owner' | 'both'
  notes?: string | null
}

export async function saveQolRecord(data: QolRecordData): Promise<OncologyQolRecordRow> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('onco_qol_records')
    .insert({
      case_id: data.case_id,
      visit_date: data.visit_date,
      body_weight: data.body_weight ?? null,
      pain_score: data.pain_score ?? null,
      hunger_score: data.hunger_score ?? null,
      hydration_score: data.hydration_score ?? null,
      hygiene_score: data.hygiene_score ?? null,
      happiness_score: data.happiness_score ?? null,
      mobility_score: data.mobility_score ?? null,
      good_days_score: data.good_days_score ?? null,
      nausea_vomiting_days: data.nausea_vomiting_days ?? null,
      lethargy_days: data.lethargy_days ?? null,
      behavior_checklist: data.behavior_checklist ?? null,
      reported_by: data.reported_by ?? 'vet',
      notes: data.notes ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`QoL 기록 저장 실패: ${error.message}`)

  revalidatePath('/', 'layout')
  return row as OncologyQolRecordRow
}

export async function updateQolRecord(id: string, data: Partial<QolRecordData>): Promise<OncologyQolRecordRow> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('onco_qol_records')
    .update({
      visit_date: data.visit_date,
      body_weight: data.body_weight ?? null,
      pain_score: data.pain_score ?? null,
      hunger_score: data.hunger_score ?? null,
      hydration_score: data.hydration_score ?? null,
      hygiene_score: data.hygiene_score ?? null,
      happiness_score: data.happiness_score ?? null,
      mobility_score: data.mobility_score ?? null,
      good_days_score: data.good_days_score ?? null,
      nausea_vomiting_days: data.nausea_vomiting_days ?? null,
      lethargy_days: data.lethargy_days ?? null,
      behavior_checklist: data.behavior_checklist ?? null,
      reported_by: data.reported_by,
      notes: data.notes ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`QoL 기록 수정 실패: ${error.message}`)

  revalidatePath('/', 'layout')
  return row as OncologyQolRecordRow
}

export async function deleteQolRecord(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_qol_records').delete().eq('id', id)

  if (error) throw new Error(`QoL 기록 삭제 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

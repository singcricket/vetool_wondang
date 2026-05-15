'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface QolRecordData {
  case_id: string
  visit_date: string
  body_weight?: number | null
  vitality_score?: number | null
  appetite_score?: number | null
  owner_score?: number | null
  notes?: string | null
}

export async function saveQolRecord(data: QolRecordData) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_qol_records').insert({
    case_id: data.case_id,
    visit_date: data.visit_date,
    body_weight: data.body_weight ?? null,
    vitality_score: data.vitality_score ?? null,
    appetite_score: data.appetite_score ?? null,
    owner_score: data.owner_score ?? null,
    notes: data.notes ?? null,
  })

  if (error) throw new Error(`QoL 기록 저장 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

export async function deleteQolRecord(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_qol_records').delete().eq('id', id)

  if (error) throw new Error(`QoL 기록 삭제 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

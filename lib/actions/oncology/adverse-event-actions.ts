'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AdverseEventData {
  case_id: string
  case_protocol_id?: string | null
  event_date: string
  event_type: string
  drug_name?: string | null
  vcog_grade: number
  description?: string | null
  action_taken?: string | null
  resolved?: boolean
  resolved_date?: string | null
  reported_by?: 'vet' | 'owner'
}

export async function saveAdverseEvent(data: AdverseEventData) {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('onco_adverse_events')
    .insert({
      case_id: data.case_id,
      case_protocol_id: data.case_protocol_id ?? null,
      event_date: data.event_date,
      event_type: data.event_type,
      drug_name: data.drug_name ?? null,
      vcog_grade: data.vcog_grade,
      description: data.description ?? null,
      action_taken: data.action_taken ?? null,
      reported_by: data.reported_by ?? 'vet',
      resolved: data.resolved ?? false,
      resolved_date: data.resolved_date ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`부작용 기록 저장 실패: ${error.message}`)

  revalidatePath('/', 'layout')
  return row
}

export async function updateAdverseEvent(id: string, data: Partial<AdverseEventData>) {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('onco_adverse_events')
    .update({
      event_date: data.event_date,
      event_type: data.event_type,
      drug_name: data.drug_name ?? null,
      vcog_grade: data.vcog_grade,
      description: data.description ?? null,
      action_taken: data.action_taken ?? null,
      reported_by: data.reported_by,
      resolved: data.resolved,
      resolved_date: data.resolved_date ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`부작용 기록 수정 실패: ${error.message}`)

  revalidatePath('/', 'layout')
  return row
}

export async function deleteAdverseEvent(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_adverse_events').delete().eq('id', id)

  if (error) throw new Error(`부작용 기록 삭제 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OncologyResponseEvalRow, ResponseTargetLesion } from '@/lib/services/oncology/fetch-oncology-case'

export interface ResponseEvalData {
  case_id: string
  case_protocol_id?: string | null
  eval_date: string
  criteria_system: 'RECIST1.1' | 'WHO' | 'VCOG' | 'clinical'
  modalities: string[]
  target_lesions: ResponseTargetLesion[]
  sum_baseline_mm?: number | null
  sum_current_mm?: number | null
  percent_change?: number | null
  non_target_status?: string
  new_lesions?: boolean
  new_lesions_desc?: string | null
  overall_response: string
  clinical_impression?: string | null
  marker_name?: string | null
  marker_baseline?: number | null
  marker_current?: number | null
  marker_unit?: string | null
  notes?: string | null
}

export async function saveResponseEval(data: ResponseEvalData): Promise<OncologyResponseEvalRow> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('onco_response_evals')
    .insert({
      case_id: data.case_id,
      case_protocol_id: data.case_protocol_id ?? null,
      eval_date: data.eval_date,
      criteria_system: data.criteria_system,
      modalities: data.modalities,
      target_lesions: data.target_lesions,
      sum_baseline_mm: data.sum_baseline_mm ?? null,
      sum_current_mm: data.sum_current_mm ?? null,
      percent_change: data.percent_change ?? null,
      non_target_status: data.non_target_status ?? 'NA',
      new_lesions: data.new_lesions ?? false,
      new_lesions_desc: data.new_lesions_desc ?? null,
      overall_response: data.overall_response,
      clinical_impression: data.clinical_impression ?? null,
      marker_name: data.marker_name ?? null,
      marker_baseline: data.marker_baseline ?? null,
      marker_current: data.marker_current ?? null,
      marker_unit: data.marker_unit ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`치료 반응 평가 저장 실패: ${error.message}`)

  revalidatePath('/', 'layout')
  return row as OncologyResponseEvalRow
}

export async function updateResponseEval(id: string, data: Partial<ResponseEvalData>): Promise<OncologyResponseEvalRow> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('onco_response_evals')
    .update({
      eval_date: data.eval_date,
      criteria_system: data.criteria_system,
      modalities: data.modalities,
      target_lesions: data.target_lesions,
      sum_baseline_mm: data.sum_baseline_mm ?? null,
      sum_current_mm: data.sum_current_mm ?? null,
      percent_change: data.percent_change ?? null,
      non_target_status: data.non_target_status ?? 'NA',
      new_lesions: data.new_lesions ?? false,
      new_lesions_desc: data.new_lesions_desc ?? null,
      overall_response: data.overall_response,
      clinical_impression: data.clinical_impression ?? null,
      marker_name: data.marker_name ?? null,
      marker_baseline: data.marker_baseline ?? null,
      marker_current: data.marker_current ?? null,
      marker_unit: data.marker_unit ?? null,
      notes: data.notes ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`치료 반응 평가 수정 실패: ${error.message}`)

  revalidatePath('/', 'layout')
  return row as OncologyResponseEvalRow
}

export async function deleteResponseEval(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_response_evals').delete().eq('id', id)

  if (error) throw new Error(`치료 반응 평가 삭제 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ResponseEvalData {
  case_id: string
  case_protocol_id?: string | null
  eval_date: string
  modality: string
  response_type: string
  measurement_before?: number | null
  measurement_after?: number | null
  notes?: string | null
}

export async function saveResponseEval(data: ResponseEvalData) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_response_evals').insert({
    case_id: data.case_id,
    case_protocol_id: data.case_protocol_id ?? null,
    eval_date: data.eval_date,
    modality: data.modality,
    response_type: data.response_type,
    measurement_before: data.measurement_before ?? null,
    measurement_after: data.measurement_after ?? null,
    notes: data.notes ?? null,
    image_urls: [],
  })

  if (error) throw new Error(`치료 반응 평가 저장 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

export async function deleteResponseEval(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('onco_response_evals').delete().eq('id', id)

  if (error) throw new Error(`치료 반응 평가 삭제 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

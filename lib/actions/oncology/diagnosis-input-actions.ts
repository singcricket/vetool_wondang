'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DiagnosisInputData {
  input_type?: string
  clinical_signs?: string
  clinical_course?: string
  raw_text?: string
  additional_notes?: string | null
}

export interface CaseInfoData {
  diagnosis_name?: string
  body_weight?: number | null
  stage?: string | null
  sex?: string | null
  status?: string
  notes?: string | null
  vet_id?: string | null
  diagnosis_method?: string[]
}

export async function saveDiagnosisInput(caseId: string, data: DiagnosisInputData) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('onco_diagnosis_inputs')
    .select('id')
    .eq('case_id', caseId)
    .eq('input_type', data.input_type ?? 'text')
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('onco_diagnosis_inputs')
      .update({
        clinical_signs: data.clinical_signs ?? null,
        clinical_course: data.clinical_course ?? null,
        raw_text: data.raw_text ?? null,
        additional_notes: data.additional_notes ?? null,
      })
      .eq('id', existing.id)

    if (error) throw new Error(`진단 입력 저장 실패: ${error.message}`)
  } else {
    const { error } = await supabase.from('onco_diagnosis_inputs').insert({
      case_id: caseId,
      input_type: data.input_type ?? 'text',
      clinical_signs: data.clinical_signs ?? null,
      clinical_course: data.clinical_course ?? null,
      raw_text: data.raw_text ?? null,
      additional_notes: data.additional_notes ?? null,
    })

    if (error) throw new Error(`진단 입력 저장 실패: ${error.message}`)
  }

  revalidatePath('/', 'layout')
}

export async function updateCaseInfo(caseId: string, data: CaseInfoData) {
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {}
  if (data.diagnosis_name !== undefined) updatePayload.diagnosis_name = data.diagnosis_name
  if (data.body_weight !== undefined) updatePayload.body_weight = data.body_weight
  if (data.stage !== undefined) updatePayload.stage = data.stage
  if (data.sex !== undefined) updatePayload.sex = data.sex
  if (data.status !== undefined) updatePayload.status = data.status
  if (data.notes !== undefined) updatePayload.notes = data.notes
  if (data.vet_id !== undefined) updatePayload.vet_id = data.vet_id
  if (data.diagnosis_method !== undefined) updatePayload.diagnosis_method = data.diagnosis_method

  const { error } = await supabase.from('onco_cases').update(updatePayload).eq('id', caseId)

  if (error) throw new Error(`케이스 정보 수정 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

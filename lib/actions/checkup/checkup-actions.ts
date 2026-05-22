'use server'

import { createClient } from '@/lib/supabase/server'
import type { CheckupStatus } from '@/types/hospital/checkup-type'

export async function createCheckupRecord(params: {
  hosId: string
  patientId: string
  targetDate: string
  vetId?: string | null
}): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('checkup_records')
    .insert({
      hos_id: params.hosId,
      patient_id: params.patientId,
      checkup_date: params.targetDate,
      vet_id: params.vetId ?? null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw new Error(`검진 생성 실패: ${error.message}`)
  return data.id
}

export async function updateCheckupStatus(
  checkupId: string,
  status: CheckupStatus,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('checkup_records')
    .update({ status })
    .eq('id', checkupId)

  if (error) throw new Error(`상태 변경 실패: ${error.message}`)
}

export async function updateCheckupVet(
  checkupId: string,
  vetId: string | null,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('checkup_records')
    .update({ vet_id: vetId })
    .eq('id', checkupId)

  if (error) throw new Error(`담당의 변경 실패: ${error.message}`)
}

export async function upsertCheckupSection(params: {
  checkupId: string
  sectionType: string
  data: Record<string, unknown>
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('checkup_sections')
    .upsert(
      {
        checkup_id: params.checkupId,
        section_type: params.sectionType,
        data: params.data as any,
      },
      { onConflict: 'checkup_id,section_type' },
    )

  if (error) throw new Error(`섹션 저장 실패: ${error.message}`)
}

export async function deleteCheckupRecord(checkupId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('checkup_records')
    .delete()
    .eq('id', checkupId)

  if (error) throw new Error(`검진 삭제 실패: ${error.message}`)
}

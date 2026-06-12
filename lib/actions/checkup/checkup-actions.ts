'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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

export async function registerPatientAndCheckupRecord(params: {
  hosId: string
  targetDate: string
  vetId?: string | null
  patient: {
    name: string
    species: string
    breed: string
    gender: string
    birth: string
    hos_patient_id: string
    owner_name?: string
    hos_owner_id?: string
    microchip_no?: string
    memo?: string
    weight?: string
  }
}): Promise<string> {
  const supabase = await createClient()

  const { data: patientId, error: patientError } = await supabase.rpc('register_patient', {
    hos_id_input: params.hosId,
    name_input: params.patient.name,
    species_input: params.patient.species,
    breed_input: params.patient.breed,
    gender_input: params.patient.gender,
    birth_input: params.patient.birth,
    hos_patient_id_input: params.patient.hos_patient_id ?? '',
    owner_name_input: params.patient.owner_name ?? '',
    hos_owner_id_input: params.patient.hos_owner_id ?? '',
    microchip_no_input: params.patient.microchip_no ?? '',
    memo_input: params.patient.memo ?? '',
    body_weight_input: params.patient.weight ?? '',
  })

  if (patientError) throw new Error(`환자 등록 실패: ${patientError.message}`)

  const { data: checkupData, error: checkupError } = await supabase
    .from('checkup_records')
    .insert({
      hos_id: params.hosId,
      patient_id: patientId,
      checkup_date: params.targetDate,
      vet_id: params.vetId ?? null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (checkupError) throw new Error(`검진 생성 실패: ${checkupError.message}`)
  return checkupData.id
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

export async function deleteCheckupRecord(checkupId: string, hosId: string): Promise<void> {
  const supabase = await createClient()

  // 1. 스토리지 파일 삭제 — checkup/{checkupId}/ 경로의 모든 파일
  const { data: storageFiles } = await supabase.storage
    .from('checkup')
    .list(checkupId)

  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map((f) => `${checkupId}/${f.name}`)
    await supabase.storage.from('checkup').remove(paths)
  }

  // 2. checkup_images DB 레코드 삭제 (FK cascade 미설정 환경 대비)
  await supabase.from('checkup_images' as any).delete().eq('checkup_id', checkupId)

  // 3. checkup_sections 삭제
  await supabase.from('checkup_sections').delete().eq('checkup_id', checkupId)

  // 4. checkup_records 삭제
  const { error } = await supabase
    .from('checkup_records')
    .delete()
    .eq('id', checkupId)

  if (error) throw new Error(`검진 삭제 실패: ${error.message}`)

  revalidatePath(`/hospital/${hosId}/checkup`)
}

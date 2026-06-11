'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type GuardianPatientInfo = {
  patientName: string
  species: string
  breed: string | null
  hosName: string
  checkupDate: string
}

export type GuardianInquiryData = {
  living_type: string
  toilet_env: string
  diet_main: string
  diet_treats: string
  diet_allergies: string
  living_other: string
  condition_vitality: string
  condition_appetite: string
  condition_water: string
  condition_urination: string
  condition_defecation: string
  condition_notes: string
  chief_complaint: string
  past_history: string
  current_diseases: string
  vaccination: string
  heartworm: string
  internal_parasite: string
  external_parasite: string
  prev_checkup: string
}

/** 공유 토큰 검증 후 환자 정보 + 문진 데이터 반환 (admin client, RLS 우회) */
export async function getSharedInquiryData(shareId: string): Promise<{
  checkupId: string
  patient: GuardianPatientInfo
  inquiry: Partial<GuardianInquiryData>
}> {
  const admin = createAdminClient() as any

  const { data: share, error: shareErr } = await admin
    .from('resource_shares')
    .select('resource_id, valid_until, restricted_data')
    .eq('id', shareId)
    .eq('resource_type', 'checkup')
    .single()

  if (shareErr || !share) throw new Error('유효하지 않은 공유 링크입니다.')

  // restricted_data.mode === 'inquiry' 인 링크만 허용
  const mode = (share.restricted_data as Record<string, unknown> | null)?.mode
  if (mode !== 'inquiry') throw new Error('유효하지 않은 공유 링크입니다.')
  if (share.valid_until && new Date(share.valid_until) < new Date())
    throw new Error('공유 기한이 만료된 링크입니다.')

  const checkupId = share.resource_id as string

  const [recordRes, sectionRes] = await Promise.all([
    admin
      .from('checkup_records')
      .select('checkup_date, hos_id, patients!inner(name, species, breed)')
      .eq('id', checkupId)
      .single(),
    admin
      .from('checkup_sections')
      .select('data')
      .eq('checkup_id', checkupId)
      .eq('section_type', 'inquiry')
      .maybeSingle(),
  ])

  if (recordRes.error || !recordRes.data) throw new Error('검진 정보를 찾을 수 없습니다.')

  const hosRes = await admin
    .from('hospitals')
    .select('name')
    .eq('id', recordRes.data.hos_id)
    .single()

  const p = recordRes.data.patients as { name: string; species: string; breed: string | null }

  const rawData = (sectionRes.data?.data ?? {}) as Record<string, unknown>
  const INQUIRY_FIELDS: (keyof GuardianInquiryData)[] = [
    'living_type', 'toilet_env', 'diet_main', 'diet_treats', 'diet_allergies', 'living_other',
    'condition_vitality', 'condition_appetite', 'condition_water',
    'condition_urination', 'condition_defecation', 'condition_notes',
    'chief_complaint', 'past_history', 'current_diseases',
    'vaccination', 'heartworm', 'internal_parasite', 'external_parasite', 'prev_checkup',
  ]
  const inquiry: Partial<GuardianInquiryData> = {}
  for (const k of INQUIRY_FIELDS) {
    if (typeof rawData[k] === 'string') inquiry[k] = rawData[k] as string
  }

  return {
    checkupId,
    patient: {
      patientName: p.name,
      species: p.species,
      breed: p.breed,
      hosName: hosRes.data?.name ?? '',
      checkupDate: recordRes.data.checkup_date,
    },
    inquiry,
  }
}

/** 보호자가 작성한 문진 데이터 저장 (admin client, RLS 우회, sections 1-3만) */
export async function saveGuardianInquiry(
  shareId: string,
  checkupId: string,
  guardianData: Partial<GuardianInquiryData>,
): Promise<void> {
  const admin = createAdminClient() as any

  // 공유 토큰 재검증
  const { data: share, error: shareErr } = await admin
    .from('resource_shares')
    .select('resource_id, valid_until, restricted_data')
    .eq('id', shareId)
    .eq('resource_type', 'checkup')
    .single()

  if (shareErr || !share || share.resource_id !== checkupId)
    throw new Error('유효하지 않은 공유 링크입니다.')

  const mode = (share.restricted_data as Record<string, unknown> | null)?.mode
  if (mode !== 'inquiry') throw new Error('유효하지 않은 공유 링크입니다.')
  if (share.valid_until && new Date(share.valid_until) < new Date())
    throw new Error('공유 기한이 만료된 링크입니다.')

  // 기존 데이터 조회 (AI 분석 섹션 보존)
  const { data: existing } = await admin
    .from('checkup_sections')
    .select('data')
    .eq('checkup_id', checkupId)
    .eq('section_type', 'inquiry')
    .maybeSingle()

  const existingData = (existing?.data ?? {}) as Record<string, unknown>

  // 보호자 입력 필드만 덮어쓰기 (ai_ 필드는 보존)
  const merged = { ...existingData, ...guardianData }

  const { error } = await admin.from('checkup_sections').upsert(
    { checkup_id: checkupId, section_type: 'inquiry', data: merged },
    { onConflict: 'checkup_id,section_type' },
  )

  if (error) throw new Error(`저장 실패: ${error.message}`)
}

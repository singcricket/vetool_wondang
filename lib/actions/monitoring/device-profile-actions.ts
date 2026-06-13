'use server'

import { createClient } from '@/lib/supabase/server'
import type { DeviceProfile, FieldMapping, VerifiedSample } from '@/types/monitoring/device-profile-type'

function rowToProfile(row: any): DeviceProfile {
  return {
    id: row.id,
    hos_id: row.hos_id,
    device_name: row.device_name,
    device_memo: row.device_memo ?? null,
    layout_hint: row.layout_hint ?? null,
    field_mappings: (row.field_mappings as FieldMapping[]) ?? [],
    verified_samples: (row.verified_samples as VerifiedSample[]) ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function fetchDeviceProfiles(hosId: string): Promise<DeviceProfile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitoring_device_profiles')
    .select('*')
    .eq('hos_id', hosId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []).map(rowToProfile)
}

export async function createDeviceProfile(params: {
  hosId: string
  deviceName: string
  deviceMemo?: string | null
}): Promise<DeviceProfile> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitoring_device_profiles')
    .insert({
      hos_id: params.hosId,
      device_name: params.deviceName,
      device_memo: params.deviceMemo ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(`프로파일 생성 실패: ${error.message}`)
  return rowToProfile(data)
}

export async function updateDeviceProfile(params: {
  id: string
  deviceName?: string
  deviceMemo?: string | null
  layoutHint?: string | null
  fieldMappings?: FieldMapping[]
  verifiedSamples?: VerifiedSample[]
}): Promise<void> {
  const supabase = await createClient()
  const payload: Record<string, unknown> = {}
  if (params.deviceName !== undefined) payload.device_name = params.deviceName
  if (params.deviceMemo !== undefined) payload.device_memo = params.deviceMemo
  if (params.layoutHint !== undefined) payload.layout_hint = params.layoutHint
  if (params.fieldMappings !== undefined) payload.field_mappings = params.fieldMappings
  if (params.verifiedSamples !== undefined) payload.verified_samples = params.verifiedSamples

  const { error } = await supabase
    .from('monitoring_device_profiles')
    .update(payload)
    .eq('id', params.id)
  if (error) throw new Error(`프로파일 수정 실패: ${error.message}`)
}

export async function deleteDeviceProfile(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('monitoring_device_profiles')
    .delete()
    .eq('id', id)
  if (error) throw new Error(`프로파일 삭제 실패: ${error.message}`)
}

// 캘리브레이션 후 샘플 + 매핑 저장 (기존 데이터에 추가)
export async function saveCalibrationResult(params: {
  profileId: string
  fieldMappings: FieldMapping[]
  layoutHint: string | null
  newSample: VerifiedSample
  existingSamples: VerifiedSample[]
}): Promise<void> {
  const MAX_SAMPLES = 5
  const samples = [params.newSample, ...params.existingSamples].slice(0, MAX_SAMPLES)

  await updateDeviceProfile({
    id: params.profileId,
    fieldMappings: params.fieldMappings,
    layoutHint: params.layoutHint,
    verifiedSamples: samples,
  })
}

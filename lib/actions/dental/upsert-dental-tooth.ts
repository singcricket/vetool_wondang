'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DentalTooth } from '@/types/dental/dental-type'
import { toothNames } from '@/constants/hospital/dental/dental_chart_canine_combined'

type UpsertPayload = Partial<Omit<DentalTooth, 'id' | 'created_at' | 'updated_at'>> & {
  tooth_id: number
  chart_id: string
  hos_id: string
}

// 치아별 upsert — ON CONFLICT (chart_id, tooth_id) 처리
export async function upsertDentalTooth(payload: UpsertPayload): Promise<void> {
  const supabase = await createClient()

  // 1. 기본 데이터 구성
  const baseData: any = {
    ...payload,
    tooth_name: payload.tooth_name ?? toothNames[String(payload.tooth_id)] ?? null,
  }

  // 2. 'null' 또는 'undefined'인 필드 제거 (기존 기록을 지우지 않기 위해)
  // 단, 'status'는 필수적이거나 명시적으로 지워야 할 수도 있지만 사용자 요청에 따라 'null이 아닌 항목만 덮어쓰기' 수행
  const dataToUpsert: any = {}
  Object.entries(baseData).forEach(([key, value]) => {
    // null, undefined, "" 은 덮어쓰지 않음 (단, boolean false는 유효값)
    if (value !== null && value !== undefined && value !== "") {
      dataToUpsert[key] = value
    }
  })

  // 3. 특수 필드 보정 (DENTAL_TOOTH_TESTS 상 'none'을 null로 처리해야 하는 값들이 있다면 여기서 처리)
  // 하지만 사용자 요구사항이 '입력된 값이 null이면 덮어쓰지 않기'이므로 
  // 입력 폼에서 '선택 안 함'을 선택했을 때 "" 가 넘어온다면 위에서 걸러짐.
  
  // gingivitis/calculus 등급 항목들 중 'none' 문자열이 들어오는 경우 null 처리 (DB 제약조건 준수)
  const nullableFields = ['gingivitis', 'calculus', 'plaque', 'mobility', 'furcation']
  nullableFields.forEach(f => {
    if (dataToUpsert[f] === 'none') dataToUpsert[f] = null
  })

  console.log('Filtered data to upsert:', dataToUpsert)

  const { error } = await supabase
    .from('dental_chart_teeth')
    .upsert(dataToUpsert, { onConflict: 'chart_id,tooth_id' })

  if (error) throw new Error(`upsertDentalTooth: ${error.message}`)

  revalidatePath('/', 'layout')
}

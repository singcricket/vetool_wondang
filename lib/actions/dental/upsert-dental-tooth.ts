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

  // 데이터 보정: DB 제약 조건(Check Constraint)을 준수하기 위해 레거시 'none' 값을 null로 처리.
  // 주의: caries, fracture 등은 원래 'none' 값이 허용되지만, gingivitis/calculus 등급 항목들은 허용되지 않음.
  const dataToUpsert = {
    ...payload,
    tooth_name: payload.tooth_name ?? toothNames[String(payload.tooth_id)] ?? null,
    gingivitis: payload.gingivitis === 'none' ? null : payload.gingivitis || null,
    calculus: payload.calculus === 'none' ? null : payload.calculus || null,
    plaque: payload.plaque === 'none' ? null : payload.plaque || null,
    mobility: payload.mobility === 'none' ? null : payload.mobility || null,
    furcation: payload.furcation === 'none' ? null : payload.furcation || null,
    // 이 외 필드는 payload에서 넘어온 값을 그대로 사용하거나 비어있으면 null로.
    periodontal_stage: payload.periodontal_stage || null,
    fracture: payload.fracture || null,
    caries: payload.caries || null,
    resorption_stage: payload.resorption_stage || null,
    resorption_type: payload.resorption_type || null,
    attrition: payload.attrition || null,
    abrasion: payload.abrasion || null,
  }

  console.log('Normalized data to upsert:', dataToUpsert)

  const { error } = await supabase
    .from('dental_chart_teeth')
    .upsert(dataToUpsert, { onConflict: 'chart_id,tooth_id' })

  if (error) throw new Error(`upsertDentalTooth: ${error.message}`)

  revalidatePath('/', 'layout')
}

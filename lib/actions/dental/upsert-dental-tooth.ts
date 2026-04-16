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

  const dataToUpsert = {
    ...payload,
    tooth_name: payload.tooth_name ?? toothNames[String(payload.tooth_id)] ?? null,
  }

  const { error } = await supabase
    .from('dental_chart_teeth')
    .upsert(dataToUpsert, { onConflict: 'chart_id,tooth_id' })

  if (error) throw new Error(`upsertDentalTooth: ${error.message}`)

  revalidatePath('/', 'layout')
}

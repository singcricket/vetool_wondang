'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DentalChartDetail } from '@/types/dental/dental-type'

// chart-level 필드 명시적 저장
export async function updateDentalChart(
  chartId: string,
  hosId: string,
  data: Partial<
    Omit<DentalChartDetail, 'id' | 'hos_id' | 'patient_id' | 'chart_date' | 'created_at' | 'updated_at' | 'patient'>
  >,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dental_charts')
    .update(data)
    .eq('id', chartId)
    .eq('hos_id', hosId)

  if (error) throw new Error(`updateDentalChart: ${error.message}`)

  revalidatePath('/', 'layout')
}

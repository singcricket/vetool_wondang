'use server'

import { createClient } from '@/lib/supabase/server'
import type { DentalImage } from '@/types/dental/dental-type'

export async function getDentalImages(chartId: string): Promise<DentalImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dental_images')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get dental images', error)
    throw new Error('이미지 목록을 불러오지 못했습니다.')
  }

  return data as DentalImage[]
}

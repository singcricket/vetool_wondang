'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOphthalmicImages(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ophthalmic_images')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch ophthalmic images', error)
    return []
  }

  return data
}

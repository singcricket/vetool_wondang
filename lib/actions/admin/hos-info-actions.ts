'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type HosInfo = {
  address?: string
  phone?: string
  hours?: string
  tagline?: string
}

export async function getHosInfo(hosId: string): Promise<HosInfo | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hospitals')
    .select('hos_info')
    .eq('hos_id', hosId)
    .single()
  if (error || !data) return null
  return (data.hos_info as HosInfo) ?? null
}

export async function updateHosInfo(hosId: string, info: HosInfo): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('hospitals')
    .update({ hos_info: info })
    .eq('hos_id', hosId)
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/admin/hos-info`)
}

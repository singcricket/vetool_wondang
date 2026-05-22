'use server'

import { createClient } from '@/lib/supabase/server'

export type CheckupLayoutData = {
  vetList: { user_id: string; name: string }[]
}

export async function fetchCheckupLayoutData(hosId: string): Promise<CheckupLayoutData> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('name, user_id, rank')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: true })

  if (error) throw new Error(`fetchCheckupLayoutData: ${error.message}`)

  return {
    vetList: (data ?? []).map((item: any) => ({
      user_id: item.user_id,
      name: item.name,
    })),
  }
}

'use server'

import { createClient } from '@/lib/supabase/server'

export type DentalLayoutData = {
  vetList: { user_id: string; name: string }[]
}

export async function fetchDentalLayoutData(
  hosId: string,
): Promise<DentalLayoutData> {
  const supabase = await createClient()

  // 1. 수의사(VET) 목록 조회
  const { data: vetData, error: vetError } = await supabase
    .from('users')
    .select('name, position, user_id, avatar_url, rank')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: true })

  if (vetError) throw new Error(`fetchDentalLayoutData: ${vetError.message}`)

  const vetList = (vetData ?? []).map((item: any) => ({
    user_id: item.user_id,
    name: item.name,
  }))

  return {
    vetList,
  }
}

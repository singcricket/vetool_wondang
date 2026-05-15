'use server'

import { createClient } from '@/lib/supabase/server'

export type OncologyLayoutData = {
  vetList: { user_id: string; name: string }[]
}

export async function fetchOncologyLayoutData(
  hosId: string,
): Promise<OncologyLayoutData> {
  const supabase = await createClient()

  const { data: vetData, error: vetError } = await supabase
    .from('users')
    .select('name, user_id, rank')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: true })

  if (vetError) throw new Error(`fetchOncologyLayoutData: ${vetError.message}`)

  const vetList = (vetData ?? []).map((item: any) => ({
    user_id: item.user_id,
    name: item.name,
  }))

  return { vetList }
}

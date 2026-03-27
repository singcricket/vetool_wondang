'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Vet } from '@/types'

export type EchoLayoutData = {
  vetList: Vet[]
}

export async function fetchEchoLayoutData(
  hosId: string,
): Promise<EchoLayoutData> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('name, position, user_id, avatar_url, rank')
    .eq('hos_id', hosId)
    .eq('is_vet', true)
    .eq('is_active', true)
    .order('rank', { ascending: true })

  if (error) {
    console.error('fetchEchoLayoutData error', error.message)
    redirect(`/error?message=${error.message}`)
  }

  return {
    vetList: (data ?? []) as Vet[],
  }
}

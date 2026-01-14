'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClaims, User } from '@/types'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export type VetoolUser = Pick<
  User,
  | 'email'
  | 'name'
  | 'avatar_url'
  | 'position'
  | 'is_admin'
  | 'user_id'
  | 'hos_id'
  | 'is_super'
  | 'is_admin'
>

export const getVetoolUserData = cache(async () => {
  const supabase = await createClient()
  const { data, error: supabaseUserError } = await supabase.auth.getClaims()

  if (supabaseUserError) {
    console.error(supabaseUserError)
    redirect('/login')
  }

  if (!data) {
    redirect('/login')
  }

  const supabaseClaims = data.claims as SupabaseClaims

  const { data: vetoolUser, error: vetoolUserError } = await supabase
    .from('users')
    .select(
      `
        email,
        name, 
        avatar_url, 
        position, 
        is_admin, 
        user_id, 
        hos_id, 
        is_super, 
        is_admin
      `,
    )
    .eq('user_id', supabaseClaims.sub)
    .single()

  if (vetoolUserError) {
    console.error(vetoolUserError)
    redirect(`/error?message=${vetoolUserError.message}`)
  }

  return vetoolUser
})

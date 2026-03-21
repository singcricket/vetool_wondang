'use server'

import { createClient } from '@/lib/supabase/server'

export const submitAbTestResult = async (
  hos_id: string,
  test_name: string,
  selected_option: string,
  other_opinion?: string,
) => {
  const supabase = await createClient()

  // @ts-ignore
  const { error } = await supabase.from('ab_test_results').insert({
    hos_id,
    test_name,
    selected_option,
    other_opinion,
  })

  // Log error but don't crash client significantly if it fails
  if (error) {
    console.error('Error submitting AB test result:', error)
    throw new Error('Failed to submit AB test result')
  }
}

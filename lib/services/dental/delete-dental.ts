'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteDentalChart(chartId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dental_charts')
    .delete()
    .eq('id', chartId)

  if (error) {
    console.error('Failed to delete dental chart:', error)
    throw new Error(error.message)
  }
}

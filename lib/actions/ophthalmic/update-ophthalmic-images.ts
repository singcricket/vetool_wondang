'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOphthalmicImages(
  payload: {
    id: string
    tags: string[]
    side: string
  }[],
  hosId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ophthalmic_images')
    .upsert(payload)

  if (error) {
    console.error('Error updating ophthalmic images:', error)
    throw new Error('Failed to update image information')
  }

  revalidatePath(`/hospital/${hosId}/ophthalmic`, 'layout')
}

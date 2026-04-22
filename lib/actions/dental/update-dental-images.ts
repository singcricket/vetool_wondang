'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type UpdatePayload = {
  dental_image_id: string
  tooth_ids: string[]
  dental_chart_teeth_ids: string[]
  is_radio: boolean
  other_tags?: string[]
}

export async function updateDentalImages(updates: UpdatePayload[], hosId: string) {
  const supabase = await createClient()

  // Supabase RESTful update does not natively support bulk update with different values per ID easily via js client.
  // We'll iterate and update sequentially since image batches are small.
  for (const update of updates) {
    const { error } = await supabase
      .from('dental_images')
      .update({
        tooth_ids: update.tooth_ids,
        dental_chart_teeth_ids: update.dental_chart_teeth_ids,
        is_radio: update.is_radio,
        other_tags: update.other_tags || [],
      })
      .eq('dental_image_id', update.dental_image_id)

    if (error) {
      console.error('Failed to update dental image', error)
      throw new Error('일부 이미지 설정 변경에 실패했습니다.')
    }
  }

  revalidatePath(`/hospital/${hosId}/dental`)
}

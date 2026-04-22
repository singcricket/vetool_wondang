'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function insertDentalImages(
  imagesData: {
    chart_id: string
    tooth_ids: string[]
    dental_chart_teeth_ids: string[]
    other_tags: string[]
    mark: string | null
    img_url: string
    is_radio: boolean
  }[],
  hosId: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from('dental_images').insert(imagesData)

  if (error) {
    console.error('Failed to insert dental images', error)
    throw new Error('이미지 정보 저장에 실패했습니다.')
  }

  revalidatePath(`/hospital/${hosId}/dental`)
}

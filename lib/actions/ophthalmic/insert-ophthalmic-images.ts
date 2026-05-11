'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function insertOphthalmicImages(
  imagesData: {
    chart_id: string
    hos_id: string
    img_url: string
    tags: string[]
    side: string
  }[],
  hosId: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from('ophthalmic_images').insert(imagesData)

  if (error) {
    console.error('Failed to insert ophthalmic images', error)
    throw new Error('이미지 정보 저장에 실패했습니다.')
  }

  revalidatePath(`/hospital/${hosId}/ophthalmic`)
}

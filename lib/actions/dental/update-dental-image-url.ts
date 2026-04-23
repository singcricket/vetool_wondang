'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 이미지 자르기(Crop) 등 작업 후 이미지 URL 자체를 변경할 때 사용
 */
export async function updateDentalImageUrl(
  dentalImageId: string, 
  newImageUrl: string,
  hosId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dental_images')
    .update({
      img_url: newImageUrl,
      // 자르기를 적용했으므로 기존 마킹은 초기화 (좌표 매칭 안됨)
      mark: null 
    })
    .eq('dental_image_id', dentalImageId)

  if (error) {
    console.error('Failed to update dental image url', error)
    throw new Error('이미지 URL 연동에 실패했습니다.')
  }

  revalidatePath(`/hospital/${hosId}/dental`)
}

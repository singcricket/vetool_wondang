'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDentalImageMark(dentalImageId: string, markJson: string, hosId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dental_images')
    .update({
      mark: markJson,
    })
    .eq('dental_image_id', dentalImageId)

  if (error) {
    console.error('Failed to update dental image mark', error)
    throw new Error('이미지 마커(어노테이션) 저장에 실패했습니다.')
  }

  // 병원의 치과 차트 목록이나 상세 화면을 갱신
  revalidatePath(`/hospital/${hosId}/dental`)
}

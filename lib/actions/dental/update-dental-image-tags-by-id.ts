'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDentalImageTagsById(
  dentalImageId: string, 
  toothIds: string[], 
  isRadio: boolean, 
  otherTags: string[], 
  hosId: string
) {
  const supabase = await createClient()

  // 1. Get the image record to find dental_chart_id
  const { data: imgData, error: imgError } = await supabase
    .from('dental_images')
    .select('dental_chart_id')
    .eq('dental_image_id', dentalImageId)
    .single()

  if (imgError || !imgData) throw new Error('이미지 정보를 불러올 수 없습니다.')

  // 2. Fetch all teeth for this chart to map tooth_ids to dental_chart_teeth_ids
  const { data: teethData, error: teethError } = await supabase
    .from('dental_chart_teeth')
    .select('id, tooth_id')
    .eq('dental_chart_id', imgData.dental_chart_id)
    .not('tooth_id', 'is', null)

  let matchedTeethIds: string[] = []
  if (!teethError && teethData) {
    matchedTeethIds = teethData
      .filter(t => toothIds.includes(String(t.tooth_id)))
      .map(t => t.id)
  }

  // 3. Update the image
  const { error } = await supabase
    .from('dental_images')
    .update({
      tooth_ids: toothIds,
      dental_chart_teeth_ids: matchedTeethIds,
      is_radio: isRadio,
      other_tags: otherTags
    })
    .eq('dental_image_id', dentalImageId)

  if (error) {
    console.error('Failed to update image tags', error)
    throw new Error('태그 수정에 실패했습니다.')
  }

  revalidatePath(`/hospital/${hosId}/dental`)
}

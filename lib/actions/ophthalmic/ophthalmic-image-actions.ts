'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 특정 안과 이미지의 상세 정보(마킹, 태그 등)를 가져옵니다.
 */
export async function getOphthalmicImageDetails(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ophthalmic_images')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ophthalmic image details:', error)
    return null
  }
  return data
}

/**
 * 안과 이미지의 마킹(JSON) 정보를 업데이트합니다.
 */
export async function updateOphthalmicImageMark(id: string, mark: string, hosId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ophthalmic_images')
    .update({ mark })
    .eq('id', id)

  if (error) {
    console.error('Error updating ophthalmic image mark:', error)
    throw new Error('Failed to save markings')
  }

  revalidatePath(`/hospital/${hosId}/ophthalmic`, 'layout')
}

/**
 * 안과 이미지의 태그와 방향 정보를 업데이트합니다.
 */
export async function updateOphthalmicImageTagsById(
  id: string, 
  tags: string[], 
  side: string, 
  hosId: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ophthalmic_images')
    .update({ tags, side })
    .eq('id', id)

  if (error) {
    console.error('Error updating ophthalmic image tags:', error)
    throw new Error('Failed to update tags')
  }

  revalidatePath(`/hospital/${hosId}/ophthalmic`, 'layout')
}

/**
 * 이미지 자르기(Crop) 후 새로운 URL로 교체합니다.
 */
export async function updateOphthalmicImageUrl(id: string, imgUrl: string, hosId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('ophthalmic_images')
    .update({ img_url: imgUrl })
    .eq('id', id)

  if (error) {
    console.error('Error updating ophthalmic image URL:', error)
    throw new Error('Failed to update image URL')
  }

  revalidatePath(`/hospital/${hosId}/ophthalmic`, 'layout')
}

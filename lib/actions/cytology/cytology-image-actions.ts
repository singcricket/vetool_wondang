'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCytologyImageDetails(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cytology_images')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cytology image details:', error)
    return null
  }
  return data
}

export async function updateCytologyImageUrl(id: string, imageUrl: string, hosId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cytology_images')
    .update({ image_url: imageUrl })
    .eq('id', id)

  if (error) {
    console.error('Error updating cytology image URL:', error)
    throw new Error('Failed to update image URL')
  }

  revalidatePath(`/hospital/${hosId}/cytology`, 'layout')
}

export async function insertCytologyImages(
  imagesData: {
    chart_id: string
    hos_id: string
    image_url: string
    tags: string | null
    marks?: any | null
  }[],
  hosId: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from('cytology_images').insert(imagesData)

  if (error) {
    console.error('Failed to insert cytology images', error)
    throw new Error('이미지 정보 저장에 실패했습니다.')
  }

  revalidatePath(`/hospital/${hosId}/cytology`)
}

export async function getCytologyImages(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cytology_images')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to get cytology images', error)
    return []
  }

  return data
}

export async function updateCytologyImages(
  updates: { id: string; tags: string | null; marks?: any | null }[],
  hosId: string
) {
  const supabase = await createClient()

  for (const update of updates) {
    const { error } = await supabase
      .from('cytology_images')
      .update({ 
        tags: update.tags,
        marks: update.marks 
      })
      .eq('id', update.id)

    if (error) {
      console.error('Failed to update cytology image', error)
      throw new Error('이미지 정보 수정에 실패했습니다.')
    }
  }

  revalidatePath(`/hospital/${hosId}/cytology`)
}

export async function deleteCytologyImage(id: string, imageUrl: string, hosId: string) {
  const supabase = await createClient()

  // 1. Storage에서 삭제
  const path = imageUrl.split('cytology-images/')[1]
  if (path) {
    await supabase.storage.from('cytology-images').remove([path])
  }

  // 2. DB에서 삭제
  const { error } = await supabase.from('cytology_images').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete cytology image', error)
    throw new Error('이미지 삭제에 실패했습니다.')
  }

  revalidatePath(`/hospital/${hosId}/cytology`)
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function insertDermImage(params: {
  hosId: string
  chartId: string
  lesionGroupId: string | null
  imageType: 'overview' | 'detail'
  imageUrl: string
  sortOrder?: number
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_images')
    .insert({
      hos_id: params.hosId,
      chart_id: params.chartId,
      lesion_group_id: params.lesionGroupId,
      image_type: params.imageType,
      image_url: params.imageUrl,
      sort_order: params.sortOrder ?? 0,
    })
    .select()
    .single()

  if (error) throw new Error(`이미지 저장 실패: ${error.message}`)
  revalidatePath(`/hospital/${params.hosId}/derm`, 'layout')
  return data
}

export async function deleteDermImage(imageId: string, imageUrl: string, hosId: string) {
  const supabase = await createClient()

  // Storage 삭제
  const path = imageUrl.split('derm-images/')[1]
  if (path) {
    await supabase.storage.from('derm-images').remove([path])
  }

  const { error } = await (supabase as any)
    .from('derm_images')
    .delete()
    .eq('id', imageId)

  if (error) throw new Error(`이미지 삭제 실패: ${error.message}`)
  revalidatePath(`/hospital/${hosId}/derm`, 'layout')
}

export async function getDermImagesAction(chartId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('derm_images')
    .select('*')
    .eq('chart_id', chartId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getDermImagesAction error:', error.message)
    return []
  }

  return data
}

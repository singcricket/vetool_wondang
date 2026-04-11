'use server'

import { createClient } from '@/lib/supabase/server'
import type { EchoTemplateGuideImage } from '@/types/echocardio/echocardio-type'

// =============================================
// 가이드 이미지 등록 (템플릿에 연결)
// =============================================
export async function insertEchoGuideImage(params: {
  templateId: string
  viewName: string
  imageUrl: string
  mappedKeywords: string[]
  displayOrder: number
}): Promise<EchoTemplateGuideImage> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('echo_template_guide_images')
    .insert({
      template_id: params.templateId,
      view_name: params.viewName,
      image_url: params.imageUrl,
      mapped_keywords: params.mappedKeywords,
      display_order: params.displayOrder,
    })
    .select()
    .single()

  if (error) throw new Error(`insertEchoGuideImage: ${error.message}`)
  return data as unknown as EchoTemplateGuideImage
}

// =============================================
// 가이드 이미지 매핑 항목 업데이트
// =============================================
export async function updateGuideImageMapping(
  imageId: string,
  mappedKeywords: string[],
  viewName: string,
  imageUrl?: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_template_guide_images')
    .update({ 
      mapped_keywords: mappedKeywords, 
      view_name: viewName,
      ...(imageUrl !== undefined && { image_url: imageUrl })
    })
    .eq('id', imageId)
  if (error) throw new Error(`updateGuideImageMapping: ${error.message}`)
}

// =============================================
// 가이드 이미지 순서 업데이트
// =============================================
export async function updateGuideImageOrder(
  updates: { id: string; display_order: number }[],
): Promise<void> {
  const supabase = await createClient()
  await Promise.all(
    updates.map(({ id, display_order }) =>
      supabase
        .from('echo_template_guide_images')
        .update({ display_order })
        .eq('id', id),
    ),
  )
}

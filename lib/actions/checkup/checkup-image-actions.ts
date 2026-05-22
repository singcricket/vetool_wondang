'use server'

import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  ALL_CHECKUP_TAG_IDS,
  CHECKUP_TAG_LABEL,
  CHECKUP_IMAGE_TAG_GROUPS,
} from '@/constants/hospital/checkup/checkup-image-tags'

export type CheckupImage = {
  id: string
  checkup_id: string
  hos_id: string
  img_url: string
  tags: string[]
  is_cover: boolean
  created_at: string
}

export async function insertCheckupImages(
  images: {
    checkup_id: string
    hos_id: string
    img_url: string
    tags: string[]
    is_cover: boolean
  }[],
): Promise<void> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('checkup_images').insert(images)
  if (error) throw new Error(`이미지 저장 실패: ${error.message}`)
}

export async function getCheckupImages(checkupId: string): Promise<CheckupImage[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('checkup_images')
    .select('*')
    .eq('checkup_id', checkupId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as CheckupImage[]
}

export async function updateCheckupImageTags(
  imageId: string,
  tags: string[],
  isCover: boolean,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('checkup_images')
    .update({ tags, is_cover: isCover })
    .eq('id', imageId)
  if (error) throw new Error(`태그 저장 실패: ${error.message}`)
}

export async function deleteCheckupImages(imageIds: string[]): Promise<void> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('checkup_images')
    .delete()
    .in('id', imageIds)
  if (error) throw new Error(`삭제 실패: ${error.message}`)
}

export async function suggestCheckupImageTags(
  base64Image: string,
  mimeType: string,
): Promise<string[]> {
  const client = new Anthropic()

  const tagDescriptions = CHECKUP_IMAGE_TAG_GROUPS.map((g) => {
    const tagList = g.tags.map((t) => `  - ${t.id}: ${t.label}`).join('\n')
    return `[${g.label}]\n${tagList}`
  }).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `이 수의학 이미지를 분석하고, 아래 태그 목록 중 이미지에 해당하는 태그 ID들을 쉼표로만 구분하여 반환하세요. 설명 없이 태그 ID만 반환하세요.\n\n${tagDescriptions}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => ALL_CHECKUP_TAG_IDS.includes(t))
}

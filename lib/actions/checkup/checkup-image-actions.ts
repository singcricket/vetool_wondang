'use server'

import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  ALL_CHECKUP_TAG_IDS,
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
    const tagList = g.tags.map((t) => `  ${t.id}: ${t.label}`).join('\n')
    return `[${g.label}]\n${tagList}`
  }).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `당신은 수의학 검진 이미지를 분류하는 전문가입니다.
이미지 하나에 해당하는 태그가 여러 개일 수 있으며, 해당하는 태그를 모두 반환해야 합니다.

멀티태깅 원칙:
- 초음파 화면에 간과 담낭이 함께 보이면 → us_liver, us_gallbladder 모두 반환
- 흉부 방사선이면 → xray_thorax (심장 크기 평가용 화면이어도 동일)
- 복부 방사선이면 → xray_abdomen
- Echo 이미지에서 좌심실 측정 화면이면 → echo_lv, 전체 심장 overview면 → echo_overview
- 척추와 사지가 함께 찍힌 방사선이면 → xray_spine, xray_extremity 모두 반환
- 해당하는 태그가 없으면 빈 문자열 반환
- 태그 ID만 쉼표로 구분하여 반환 (그 외 텍스트 금지)`,
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
            text: `이 수의학 이미지에 해당하는 태그를 아래 목록에서 모두 선택하세요.
이미지에 명확히 해당하는 태그만 포함하고, 태그 ID만 쉼표로 구분하여 반환하세요.

${tagDescriptions}`,
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

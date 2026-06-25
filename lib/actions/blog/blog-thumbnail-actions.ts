'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { BlogPost } from '@/types/hospital/blog-type'

export interface ThumbnailContent {
  headline: string      // 2줄 이내 핵심 제목
  subline: string       // 한 줄 부제목 / 결과 요약
  points: string[]      // 핵심 포인트 2~3개
  badge: string         // 카테고리 뱃지 텍스트
}

const client = new Anthropic()

export async function generateThumbnailContent(post: BlogPost): Promise<ThumbnailContent> {
  const info = [
    `제목: ${post.title}`,
    `진료분야: ${post.case_category}`,
    post.diagnosis ? `진단명: ${post.diagnosis}` : null,
    post.species ? `종: ${post.species === 'canine' ? '개' : post.species === 'feline' ? '고양이' : post.species === 'exotic' ? '특수동물' : '기타'}` : null,
    post.summary ? `요약: ${post.summary}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `다음 수의 케이스 정보를 바탕으로 SNS/블로그 썸네일 카드에 넣을 짧은 텍스트를 작성해줘.

${info}

아래 JSON 형식으로만 응답해 (다른 설명 없이):
{
  "headline": "임팩트 있는 핵심 문구 (15자 이내, 줄바꿈 없이)",
  "subline": "결과 또는 핵심 메시지 한 줄 (20자 이내)",
  "points": ["핵심 포인트1 (10자 이내)", "핵심 포인트2 (10자 이내)", "핵심 포인트3 (10자 이내)"],
  "badge": "진료분야 한 단어 (6자 이내)"
}

작성 원칙:
- 보호자 눈높이에서 공감되는 표현
- 회복, 치료 성공 사례는 희망적 톤
- 불확실한 예후/약물 정보는 포함하지 않음
- 이모지 사용 가능 (1개 정도)`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

  const parsed = JSON.parse(jsonMatch[0])
  return {
    headline: parsed.headline ?? post.title,
    subline: parsed.subline ?? '',
    points: Array.isArray(parsed.points) ? parsed.points.slice(0, 3) : [],
    badge: parsed.badge ?? post.case_category,
  }
}

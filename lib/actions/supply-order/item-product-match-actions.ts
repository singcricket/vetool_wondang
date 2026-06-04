'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAiUsage } from '@/lib/ai/log-usage'

export type ProductForMatch = {
  id: string
  brand_name: string
  manufacturer: string | null
  ingredient: string | null
  specification: string | null
  category: string[]
  tag: string[]
}

export type MatchResult = {
  product_id: string
  master_id: string | null
  confidence: number
  reason: string
}

export async function getUnlinkedProducts(hosId: string): Promise<ProductForMatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_products')
    .select('id, brand_name, manufacturer, ingredient, specification, category, tag')
    .eq('hos_id', hosId)
    .eq('is_active', true)
    .is('item_master_id', null)
    .order('brand_name')
  if (error) throw new Error(error.message)
  return (data ?? []) as ProductForMatch[]
}

export async function matchProductBatch(
  hosId: string,
  productIds: string[],
): Promise<MatchResult[]> {
  const supabase = await createClient()

  const [{ data: masters, error: masterError }, { data: products, error: productError }] =
    await Promise.all([
      supabase
        .from('item_master')
        .select('id, generic_name, ingredient, base_unit, aliases, category')
        .eq('hos_id', hosId)
        .eq('is_active', true),
      supabase
        .from('item_products')
        .select('id, brand_name, manufacturer, ingredient, specification')
        .in('id', productIds),
    ])

  if (masterError) throw new Error(masterError.message)
  if (productError) throw new Error(productError.message)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // pipe-separated for token efficiency
  const mastersText = (masters ?? [])
    .map((m: any) =>
      [
        m.id,
        m.generic_name,
        (m.ingredient ?? []).join(';'),
        m.base_unit,
        (m.aliases ?? []).join(';'),
        (m.category ?? []).join(';'),
      ].join('|')
    )
    .join('\n')

  const productsText = (products ?? [])
    .map((p: any) =>
      [p.id, p.brand_name, p.manufacturer ?? '', p.ingredient ?? '', p.specification ?? ''].join('|')
    )
    .join('\n')

  const prompt = `수의 약품/물품 매칭 전문가로서, 각 item_product를 가장 적합한 item_master에 연결하세요.

ITEM MASTERS (id|generic_name|ingredient|base_unit|aliases|category):
${mastersText}

PRODUCTS TO MATCH (id|brand_name|manufacturer|ingredient|specification):
${productsText}

매칭 규칙:
1. ingredient 일치가 최우선 (대소문자 무시, 주성분 부분 일치도 인정)
2. brand_name에서 일반명 추출하여 generic_name/aliases와 비교
3. specification과 base_unit 호환성 검토 (예: "250mg 정제" → base_unit "mg" 또는 "정")
4. 복합제는 주성분 기준으로 판단
5. 확신 없으면 master_id를 null로

confidence 기준: 90+=명확일치, 70~89=높음, 50~69=보통(검토필요), 49이하=낮음

반드시 유효한 JSON 배열만 반환 (설명 없이):
[{"product_id":"...","master_id":"...또는null","confidence":85,"reason":"한국어로 짧게"}]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  logAiUsage({
    hosId,
    feature: 'supply_order_item_match',
    model: 'claude-sonnet-4-6',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

  return JSON.parse(jsonMatch[0]) as MatchResult[]
}

export async function bulkLinkProductsToMasters(
  hosId: string,
  links: { product_id: string; master_id: string }[],
): Promise<void> {
  if (!links.length) return
  const supabase = await createClient()

  await Promise.all(
    links.map(({ product_id, master_id }) =>
      supabase
        .from('item_products')
        .update({ item_master_id: master_id })
        .eq('id', product_id)
        .eq('hos_id', hosId)
    )
  )

  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

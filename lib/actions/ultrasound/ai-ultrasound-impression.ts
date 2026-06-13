'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { buildChartSummary, organSections } from '@/constants/hospital/ultrasound'
import type { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'

export type AiUltrasoundImpressionResult = {
  comprehensive_impression_ko: string
  comprehensive_impression_en: string
  primary_dx_ko: string
  primary_dx_en: string
  ddx_ko: string[]
  ddx_en: string[]
  key_findings_ko: string[]
  key_findings_en: string[]
  recommendations_ko: string
  recommendations_en: string
}

function buildFindingsText(
  organsData: Record<string, UltrasoundChartOrgan>,
  species?: string,
): string {
  const lines: string[] = []

  for (const section of organSections) {
    const organ = organsData[section.organ]
    if (!organ || organ.status === 'not_examined') continue

    if (organ.status === 'absent') {
      lines.push(`[${section.organNameKo}] 결손/적출`)
      continue
    }

    const findings = organ.findings_data as Record<string, string | number>
    const summaries =
      organ.status === 'abnormal' || organ.status === 'normal'
        ? buildChartSummary(findings, 'ko', section.organ, 'vet', species)
        : []

    const organLines = [...summaries]
    if (organ.organ_memo?.trim()) organLines.push(`수의사 메모: ${organ.organ_memo.trim()}`)

    if (organLines.length > 0) {
      lines.push(`[${section.organNameKo}] (${organ.status === 'normal' ? '정상' : '이상'})\n${organLines.join('\n')}`)
    } else if (organ.status === 'normal') {
      lines.push(`[${section.organNameKo}] 특이 소견 없음 (정상)`)
    }
  }

  return lines.join('\n\n')
}

export async function generateUltrasoundImpression(
  organsData: Record<string, UltrasoundChartOrgan>,
  species?: string,
): Promise<{ data: AiUltrasoundImpressionResult | null; error: string | null }> {
  try {
    const findingsText = buildFindingsText(organsData, species)

    if (!findingsText.trim()) {
      return { data: null, error: '입력된 초음파 소견이 없습니다. 장기 소견을 먼저 입력해주세요.' }
    }

    const speciesLabel =
      species === 'canine' ? '개(Canine)' : species === 'feline' ? '고양이(Feline)' : '소동물'

    const systemPrompt = `You are a board-certified veterinary radiologist (DACVR) specializing in small animal abdominal ultrasonography.
You provide concise, clinically actionable ultrasound impression reports for attending veterinarians.

Key principles:
- Synthesize multi-organ findings into a coherent clinical picture — do NOT simply list each organ
- Identify inter-organ connections and the most likely underlying disease process
- Distinguish primary from secondary/reactive changes
- Keep the comprehensive impression focused: 2–4 sentences maximum
- Be specific about severity and clinical urgency
- Respond ONLY in valid JSON. No prose, no markdown outside JSON.`

    const userPrompt = `Generate a comprehensive abdominal ultrasound impression for this ${speciesLabel}.

ULTRASOUND FINDINGS:
${findingsText}

Return this exact JSON structure:
{
  "comprehensive_impression_ko": "종합 소견을 임상적 의미 단위로 구분하여 작성. 각 단위는 '• '로 시작하고 '\\n'으로 구분. 장기별 단순 나열 금지. 장기 간 연관성·전체 패턴·임상 중요도 중심으로 2–5개 항목.",
  "comprehensive_impression_en": "English version using same bullet/newline format: each point starts with '• ' separated by '\\n'. 2–5 points covering inter-organ connections and clinical significance.",
  "primary_dx_ko": "가장 가능성 높은 주진단 (간결하게 1줄)",
  "primary_dx_en": "Most likely primary diagnosis (concise)",
  "ddx_ko": ["감별진단1", "감별진단2", "감별진단3"],
  "ddx_en": ["Differential 1", "Differential 2", "Differential 3"],
  "key_findings_ko": ["주요 소견1 (주진단 지지 근거)", "주요 소견2", "주요 소견3"],
  "key_findings_en": ["Key finding 1", "Key finding 2", "Key finding 3"],
  "recommendations_ko": "권장 사항을 항목별로 구분. 각 항목은 '• '로 시작하고 '\\n'으로 구분. 예: 추가 검사, 재검 일정, 처치 방향 등을 각각 별도 항목으로.",
  "recommendations_en": "Bullet-point recommendations separated by '\\n'. Each point starts with '• '. Cover diagnostics, follow-up, and treatment direction separately."
}`

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = rawText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const result: AiUltrasoundImpressionResult = JSON.parse(stripped)

    return { data: result, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('credit') || msg.includes('quota')) {
      return { data: null, error: 'Anthropic API 크레딧이 부족합니다.' }
    }
    if (msg.includes('api_key') || msg.includes('authentication')) {
      return { data: null, error: 'API 키가 유효하지 않습니다.' }
    }
    return { data: null, error: 'AI 종합 소견 생성 중 오류가 발생했습니다.' }
  }
}

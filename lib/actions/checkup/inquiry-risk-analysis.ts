'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'

export type RiskAnalysisResult = {
  breed_risk: string
  age_risk: string
  management: string
}

function calcAgeText(birth: string | null): string {
  if (!birth) return '나이 정보 없음'
  const b = new Date(birth)
  const today = new Date()
  const totalMonths =
    (today.getFullYear() - b.getFullYear()) * 12 +
    (today.getMonth() - b.getMonth()) +
    (today.getDate() < b.getDate() ? -1 : 0)
  if (totalMonths < 12) return `${totalMonths}개월령`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월령` : `${y}세령`
}

function extractJson(text: string): RiskAnalysisResult {
  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON not found')
  return JSON.parse(clean.slice(start, end + 1))
}

export async function analyzePatientRisk(params: {
  species: string
  breed: string
  birth: string | null
  gender: string | null
}): Promise<RiskAnalysisResult> {
  const { species, breed, birth, gender } = params
  const ageText = calcAgeText(birth)
  const speciesKo = /^(cat|feline)$/i.test(species) ? '고양이' : '개'
  const genderKo = gender ?? '성별 정보 없음'

  const prompt = `당신은 수의 내과 전문의입니다. 아래 환자 정보를 바탕으로 건강검진 시 참고할 리스크 분석 및 관리 포인트를 작성해 주세요.

[환자 정보]
- 종: ${speciesKo}
- 품종: ${breed || '혼종 / 정보 없음'}
- 나이: ${ageText}
- 성별: ${genderKo}

다음 3가지 항목을 한국어로 작성하고, JSON만 반환하세요 (설명·코드블록 없이):

{
  "breed_risk": "품종별 호발 질환 및 특이사항 (2~5문장, 해당 품종에서 특히 주의해야 할 질병·해부학적 특이점·유전성 질환 등)",
  "age_risk": "현재 연령에 따른 주요 건강 리스크 (2~4문장, 이 나이대에서 흔히 발생하는 문제, 노령/성장기 특이사항 등)",
  "management": "현재 연령·품종에 맞는 관리 포인트 (항목별 간결하게, 식이관리 / 구강관리 / 정기검진 / 환경관리 / 주요 이상 증상 관찰 등 포함)"
}`

  const client = getAnthropicClient()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content.find((b) => b.type === 'text')?.text ?? ''
  return extractJson(text)
}

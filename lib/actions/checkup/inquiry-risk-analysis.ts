'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'

// ── 타입 ─────────────────────────────────────────────────────
// 각 항목을 소제목별 키-값 구조로 받아 리포트에서 CSS 개별 적용 가능

export type BreedRisk = {
  predispositions: string    // 호발 질환·주의 질병
  anatomy: string            // 해부학적·신체적 특이점
  genetic: string            // 유전성 질환·유전적 소인
}

export type AgeRisk = {
  stage: string              // 현재 생애 단계 설명
  watch_items: string        // 이 나이에 특히 체크해야 할 항목들
  preventive: string         // 예방 포인트
}

export type Management = {
  diet: string               // 식이 관리
  oral: string               // 구강 관리
  checkup: string            // 정기검진 권장사항
  environment: string        // 환경·생활 관리
  warning_signs: string      // 즉시 내원이 필요한 이상 증상
}

export type RiskAnalysisResult = {
  breed_risk: BreedRisk
  age_risk: AgeRisk
  management: Management
}

// ── 헬퍼 ─────────────────────────────────────────────────────

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
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  const start = text.indexOf('{')
  if (start === -1) throw new Error('JSON not found')
  let depth = 0, inString = false, escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)) }
  }
  throw new Error('JSON not found')
}

// ── 메인 액션 ─────────────────────────────────────────────────

export async function analyzePatientRisk(params: {
  species: string
  breed: string | null
  birth: string | null
  gender: string | null
}): Promise<RiskAnalysisResult> {
  const { species, breed, birth, gender } = params
  const ageText = calcAgeText(birth)
  const speciesKo = /^(cat|feline)$/i.test(species) ? '고양이' : '개'
  const genderKo = gender ?? '성별 정보 없음'

  const prompt = `당신은 수의 내과 전문의입니다. 보호자에게 보여줄 건강검진 리포트용 리스크 분석 내용을 작성해 주세요.

[환자 정보]
- 종: ${speciesKo}
- 품종: ${breed || '혼종 / 정보 없음'}
- 나이: ${ageText}
- 성별: ${genderKo}

작성 원칙:
- 보호자가 이해하기 쉬운 한국어로 작성
- 각 항목은 1~3문장의 간결한 설명
- 의학용어 사용 시 괄호로 쉬운 설명 병기
- JSON만 반환 (코드블록·설명 없이)

{
  "breed_risk": {
    "predispositions": "${speciesKo === '개' ? '해당 품종에서 특히 주의해야 할 질병 1~3가지를 간결하게' : '해당 품종의 주요 건강 주의사항'}",
    "anatomy": "해부학적·신체적 특이점 (체형, 피부, 눈, 관절 등)",
    "genetic": "유전성 질환 또는 유전적 소인 (없으면 '특별한 유전 질환 위험은 보고되지 않았습니다.')"
  },
  "age_risk": {
    "stage": "현재 ${ageText} 생애 단계 특징 1~2문장",
    "watch_items": "이 나이에 특히 확인해야 할 건강 항목 (장기 기능, 치아, 체중, 호르몬 등) 2~4가지",
    "preventive": "이 나이대에 권장되는 예방적 검사 또는 관리 1~2가지"
  },
  "management": {
    "diet": "현재 나이·품종에 맞는 식이 관리 핵심 1~2문장",
    "oral": "구강 관리 방법 및 권장 주기",
    "checkup": "권장 정기검진 주기 및 중점 검사 항목",
    "environment": "생활 환경 및 운동 관리 핵심 1~2문장",
    "warning_signs": "즉시 동물병원 방문이 필요한 이상 증상 2~4가지 (간결하게 나열)"
  }
}`

  const client = getAnthropicClient()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content.find((b) => b.type === 'text')?.text ?? ''
  return extractJson(text)
}

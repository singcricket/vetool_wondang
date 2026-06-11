'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { calcLifeStage, type LifeStage } from '@/lib/utils/checkup/life-stage'

// ── 타입 ─────────────────────────────────────────────────────

export type BreedRisk = {
  predispositions: string
  anatomy: string
  genetic: string
}

export type AgeRisk = {
  stage: string
  watch_items: string
  preventive: string
}

export type Management = {
  diet: string
  oral: string
  checkup: string
  environment: string
  warning_signs: string
}

export type RiskAnalysisResult = {
  breed_risk: BreedRisk
  age_risk: AgeRisk
  management: Management
}

export type AnalyzeSource =
  | 'cache_full'    // 종+품종+연령대 완전 일치
  | 'cache_breed'   // 품종만 일치 → breed_risk 캐시, age/management AI
  | 'ai_full'       // 캐시 없음 → 전체 AI

function normalizeBreed(breed: string | null): string {
  return (breed ?? '혼종').trim().toLowerCase()
}

function normalizeSpecies(species: string): string {
  return /^(cat|feline)$/i.test(species) ? 'cat' : 'dog'
}

// ── 헬퍼 ─────────────────────────────────────────────────────

function calcAgeText(birth: string | null): string {
  if (!birth) return '나이 정보 없음'
  const totalMonths =
    (new Date().getFullYear() - new Date(birth).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(birth).getMonth()) +
    (new Date().getDate() < new Date(birth).getDate() ? -1 : 0)
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

// ── AI 호출 (전체 or 연령만) ──────────────────────────────────

async function callAI(params: {
  speciesKo: string
  breed: string | null
  ageText: string
  genderKo: string
  skipBreed: boolean
}): Promise<RiskAnalysisResult> {
  const { speciesKo, breed, ageText, genderKo, skipBreed } = params

  const breedSection = skipBreed ? '' : `
  "breed_risk": {
    "predispositions": "${speciesKo === '개' ? '해당 품종에서 특히 주의해야 할 질병 1~3가지를 간결하게' : '해당 품종의 주요 건강 주의사항'}",
    "anatomy": "해부학적·신체적 특이점 (체형, 피부, 눈, 관절 등)",
    "genetic": "유전성 질환 또는 유전적 소인 (없으면 '특별한 유전 질환 위험은 보고되지 않았습니다.')"
  },`

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

{${breedSection}
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

  if (skipBreed) {
    // breed_risk 없이 파싱 → 빈 값으로 채워서 반환
    const partial = JSON.parse(
      text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    ) as Partial<RiskAnalysisResult>
    return {
      breed_risk: { predispositions: '', anatomy: '', genetic: '' },
      age_risk: partial.age_risk ?? { stage: '', watch_items: '', preventive: '' },
      management: partial.management ?? { diet: '', oral: '', checkup: '', environment: '', warning_signs: '' },
    }
  }

  return extractJson(text)
}

// ── DB 캐시 조회/저장 ─────────────────────────────────────────

type CacheRow = {
  species: string
  breed: string
  life_stage: string
  breed_risk: BreedRisk
  age_risk: AgeRisk
  management: Management
}

async function queryCache(species: string, breed: string, lifeStage: LifeStage): Promise<CacheRow | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('checkup_breed_risk_cache')
    .select('species, breed, life_stage, breed_risk, age_risk, management')
    .eq('species', species)
    .eq('breed', breed)
    .eq('life_stage', lifeStage)
    .maybeSingle()
  return (data as CacheRow | null) ?? null
}

async function queryCacheBreedOnly(species: string, breed: string): Promise<CacheRow | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('checkup_breed_risk_cache')
    .select('species, breed, life_stage, breed_risk, age_risk, management')
    .eq('species', species)
    .eq('breed', breed)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as CacheRow | null) ?? null
}

async function saveCache(row: CacheRow): Promise<void> {
  const supabase = await createClient()
  await (supabase as any)
    .from('checkup_breed_risk_cache')
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: 'species,breed,life_stage' },
    )
}

// ── 메인 액션 ─────────────────────────────────────────────────

export async function analyzePatientRisk(params: {
  species: string
  breed: string | null
  birth: string | null
  gender: string | null
}): Promise<RiskAnalysisResult & { source: AnalyzeSource }> {
  const { species, breed, birth, gender } = params

  const speciesKey  = normalizeSpecies(species)
  const breedKey    = normalizeBreed(breed)
  const lifeStage   = calcLifeStage(birth, species)
  const ageText     = calcAgeText(birth)
  const speciesKo   = speciesKey === 'cat' ? '고양이' : '개'
  const genderKo    = gender ?? '성별 정보 없음'

  // ── 1단계: 완전 일치 캐시 조회 ──────────────────────────────
  const fullHit = await queryCache(speciesKey, breedKey, lifeStage)
  if (fullHit) {
    return {
      breed_risk: fullHit.breed_risk,
      age_risk:   fullHit.age_risk,
      management: fullHit.management,
      source: 'cache_full',
    }
  }

  // ── 2단계: 품종만 일치 캐시 조회 ────────────────────────────
  const breedHit = await queryCacheBreedOnly(speciesKey, breedKey)
  if (breedHit) {
    const aiResult = await callAI({ speciesKo, breed, ageText, genderKo, skipBreed: true })
    const result: RiskAnalysisResult = {
      breed_risk: breedHit.breed_risk,   // 캐시에서
      age_risk:   aiResult.age_risk,
      management: aiResult.management,
    }
    await saveCache({
      species:    speciesKey,
      breed:      breedKey,
      life_stage: lifeStage,
      ...result,
    })
    return { ...result, source: 'cache_breed' }
  }

  // ── 3단계: 전체 AI 호출 ──────────────────────────────────────
  const aiResult = await callAI({ speciesKo, breed, ageText, genderKo, skipBreed: false })
  await saveCache({
    species:    speciesKey,
    breed:      breedKey,
    life_stage: lifeStage,
    breed_risk: aiResult.breed_risk,
    age_risk:   aiResult.age_risk,
    management: aiResult.management,
  })
  return { ...aiResult, source: 'ai_full' }
}

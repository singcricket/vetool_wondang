'use server'

import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'

function extractJson<T = unknown>(text: string): T {
  // Strategy 1: direct parse
  try { return JSON.parse(text.trim()) } catch {}

  // Strategy 2: strip markdown fences
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  // Strategy 3: brace-depth scan
  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return JSON.parse(text.slice(start, i + 1))
    }
  }

  throw new Error('No valid JSON object found in response')
}

function normalizeDiagnosisKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '_')
    .trim()
}

export type AiProtocolOption = {
  id?: string
  protocol_name: string
  protocol_type: string
  phase: string
  total_cycles: number | null
  total_weeks: number | null
  description: string | null
  mst_days: number | null
  response_rate: number | null
  drugs: DrugItem[]
  precautions: string | null
  adverse_effects: AdverseEffectItem[]
  contraindications: string | null
  owner_instructions: string | null
  owner_warning_signs: string[]
  ref_sources: RefSource[]
  is_ai_generated: boolean
  is_verified: boolean
  origin_diagnosis: string | null
  user_tags?: string | null
}

export type DrugItem = {
  drug_name: string
  route: string
  dose_value: number
  dose_unit: string
  concentration: number | null  // mg/mL — representative product concentration
  frequency: string
  cycle_day: number
  duration_days: number
  is_oral: boolean
}

export type AdverseEffectItem = {
  name: string
  vcog_grade: number
  frequency: string
  description: string
}

export type RefSource = {
  title: string
  journal: string
  year: number
}

const SYSTEM_PROMPT = `You are an expert veterinary oncologist. Respond with valid JSON ONLY — absolutely no prose, no markdown fences, no explanation before or after the JSON object.`

function buildUserPrompt(diagnosisName: string, isRescue = false): string {
  const context = isRescue
    ? `"${diagnosisName}" 진단 후 1차 치료 실패, rescue/salvage 치료 필요`
    : `"${diagnosisName}" 진단`

  const phaseNote = isRescue
    ? '- phase: "rescue" 고정'
    : '- phase: induction|maintenance|rescue|adjuvant 중 하나'

  return `수의 ${isRescue ? 'rescue' : '항암'} 프로토콜 2가지 (${context}). JSON만 반환, 다른 텍스트 금지.

{"treatment_options":[{"protocol_name":"","protocol_type":"chemo","phase":"induction","total_cycles":null,"total_weeks":null,"description":"","mst_days":null,"response_rate":null,"drugs":[{"drug_name":"","route":"iv","dose_value":0,"dose_unit":"mg/m2","concentration":1.0,"frequency":"q35d","cycle_day":1,"duration_days":1,"is_oral":false}],"precautions":"","adverse_effects":[{"name":"","vcog_grade":1,"frequency":"common","description":""}],"contraindications":"","owner_instructions":"","owner_warning_signs":[],"ref_sources":[{"title":"","journal":"","year":2024}]}]}

규칙:
- protocol_name: 영문 약어 (CHOP, UW-25, Carboplatin 등)
- protocol_type: chemo|radiation|surgery|multimodal
${phaseNote}
- route: oral|iv|sc|im 중 하나만 사용
- concentration: 대표 제제 농도 mg/mL (예: Vincristine 1.0, Doxorubicin 2.0, Cyclophosphamide 10.0, 경구정제는 null)
- frequency: q7d|q14d|q21d|q28d|q35d|q24h|q48h
  ★ frequency는 "이 약물 항목이 반복되는 간격" (사이클 길이와 동일하면 사이클당 1회)
- cycle_day: 해당 사이클 내에서 이 약물을 투여하는 날 (1=1주차, 8=2주차, 15=3주차, 22=4주차)
  ★ 같은 약물이 사이클 내 여러 주차에 투여된다면 drugs 배열에 별도 항목으로 추가
  예) CHOP 5주 사이클(total_weeks:25, total_cycles:5, frequency:q35d):
    Vincristine 1주차 → cycle_day:1, frequency:q35d
    Vincristine 3주차 → cycle_day:15, frequency:q35d
    Cyclophosphamide 2주차 → cycle_day:8, frequency:q35d
    Doxorubicin 4주차 → cycle_day:22, frequency:q35d
    Prednisolone 1-2주차 매일 → cycle_day:1, duration_days:14, frequency:q35d, is_oral:true
- duration_days: 연속 투여 일수 (기본값 1)
  경구 약물 패턴 예시:
  • 7일 매일 투여 → duration_days:7, frequency:q35d, is_oral:true (사이클당 1회 처방)
  • EOD 지속 투여 → duration_days:1, frequency:q48h, is_oral:true (사이클당 1회 확인)
  • 3일 연속 격주 투여 → duration_days:3, frequency:q14d, is_oral:true (2주마다 1회 처방)
  ★ 경구 다일 투약은 별도 항목으로 쪼개지 말고 duration_days로 표현할 것
- response_rate: 0.0~1.0 소수
- description/precautions/contraindications: 한국어, 의학용어는 한국어(English) 형식, 2문장 이내
- adverse_effects: 최대 4개, name은 한국어(English) 형식, description 1문장
- drugs: 최대 6개 항목 (같은 약물이 다른 주차에 투여되면 별도 항목)
- owner_instructions: 한국어 3문장 이내
- owner_warning_signs: 한국어, 최대 4개 항목
- ref_sources: 최대 2개`
}

export type AiGuideResult = {
  protocols: AiProtocolOption[]
  isExpired: boolean
  cachedAt: string | null
}

// Returns the frozen diagnosis_key for a case — computes and saves if not yet set
async function resolveDiagnosisKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string,
): Promise<{ diagnosisKey: string; diagnosisName: string; hosId: string }> {
  const { data: caseData, error } = await supabase
    .from('onco_cases')
    .select('diagnosis_name, hos_id, diagnosis_key')
    .eq('id', caseId)
    .single()

  if (error) throw new Error(`케이스 조회 실패: ${error.message}`)

  // If already frozen, use it
  if (caseData.diagnosis_key) {
    return { diagnosisKey: caseData.diagnosis_key, diagnosisName: caseData.diagnosis_name, hosId: caseData.hos_id }
  }

  // First time — compute and lock
  const diagnosisKey = normalizeDiagnosisKey(caseData.diagnosis_name)
  await supabase
    .from('onco_cases')
    .update({ diagnosis_key: diagnosisKey })
    .eq('id', caseId)

  return { diagnosisKey, diagnosisName: caseData.diagnosis_name, hosId: caseData.hos_id }
}

export async function getAiOncologyGuide(caseId: string): Promise<AiGuideResult> {
  const supabase = await createClient()
  const { diagnosisKey, diagnosisName, hosId } = await resolveDiagnosisKey(supabase, caseId)

  // Check cache metadata (expiry info only) — scoped to this hospital
  const { data: cached } = await supabase
    .from('onco_ai_cache')
    .select('created_at, expires_at')
    .eq('diagnosis_key', diagnosisKey)
    .eq('hos_id', hosId)
    .eq('query_type', 'treatment_options')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Protocols exist → return immediately, no AI call
  const existingProtocols = await fetchProtocolsForKey(supabase, diagnosisKey, hosId)
  if (existingProtocols.length > 0) {
    const isExpired = cached?.expires_at ? new Date(cached.expires_at) < new Date() : false
    return { protocols: existingProtocols, isExpired, cachedAt: cached?.created_at ?? null }
  }

  // No protocols → call Claude
  const protocols = await callClaudeAndSave(supabase, diagnosisName, hosId, diagnosisKey)
  return { protocols, isExpired: false, cachedAt: new Date().toISOString() }
}

export async function refreshAiOncologyGuide(caseId: string): Promise<AiGuideResult> {
  const supabase = await createClient()
  const { diagnosisKey, diagnosisName, hosId } = await resolveDiagnosisKey(supabase, caseId)

  // Deactivate previous cache for this hospital + key
  await supabase
    .from('onco_ai_cache')
    .update({ is_active: false })
    .eq('diagnosis_key', diagnosisKey)
    .eq('hos_id', hosId)
    .eq('query_type', 'treatment_options')

  const protocols = await callClaudeAndSave(supabase, diagnosisName, hosId, diagnosisKey)
  return { protocols, isExpired: false, cachedAt: new Date().toISOString() }
}

export async function getAiRescueGuide(caseId: string): Promise<AiGuideResult> {
  const supabase = await createClient()
  const { diagnosisKey, diagnosisName, hosId } = await resolveDiagnosisKey(supabase, caseId)

  const rescueKey = `${diagnosisKey}__rescue`

  const { data: cached } = await supabase
    .from('onco_ai_cache')
    .select('created_at, expires_at')
    .eq('diagnosis_key', rescueKey)
    .eq('hos_id', hosId)
    .eq('query_type', 'treatment_options')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const existingProtocols = await fetchProtocolsForKey(supabase, rescueKey, hosId)
  if (existingProtocols.length > 0) {
    const isExpired = cached?.expires_at ? new Date(cached.expires_at) < new Date() : false
    return { protocols: existingProtocols, isExpired, cachedAt: cached?.created_at ?? null }
  }

  const protocols = await callClaudeAndSave(supabase, diagnosisName, hosId, rescueKey, true)
  return { protocols, isExpired: false, cachedAt: new Date().toISOString() }
}

const DRUG_ROUTE_MAP: Record<string, string> = {
  oral: 'oral',
  po: 'oral',
  'per os': 'oral',
  'per oral': 'oral',
  iv: 'iv',
  intravenous: 'iv',
  'i.v.': 'iv',
  'iv infusion': 'iv',
  sc: 'sc',
  subcutaneous: 'sc',
  'sub-q': 'sc',
  'sub-cutaneous': 'sc',
  im: 'im',
  intramuscular: 'im',
  'i.m.': 'im',
}

const PROTOCOL_TYPE_MAP: Record<string, string> = {
  chemo: 'chemo',
  chemotherapy: 'chemo',
  targeted: 'chemo',
  immunotherapy: 'chemo',
  palliative: 'chemo',
  radiation: 'radiation',
  radiotherapy: 'radiation',
  surgery: 'surgery',
  surgical: 'surgery',
  multimodal: 'multimodal',
  combination: 'multimodal',
}

const PHASE_MAP: Record<string, string> = {
  induction: 'induction',
  maintenance: 'maintenance',
  rescue: 'rescue',
  salvage: 'rescue',
  adjuvant: 'adjuvant',
  neoadjuvant: 'adjuvant',
  palliative: 'adjuvant',
}

function sanitizeProtocolOptions(options: AiProtocolOption[]): AiProtocolOption[] {
  return options.map((opt) => ({
    ...opt,
    protocol_type: PROTOCOL_TYPE_MAP[opt.protocol_type?.toLowerCase()] ?? 'chemo',
    phase: PHASE_MAP[opt.phase?.toLowerCase()] ?? 'induction',
    // response_rate: AI often returns percentage (65) instead of decimal (0.65)
    response_rate:
      opt.response_rate == null
        ? null
        : opt.response_rate > 1
          ? Math.min(Math.round(opt.response_rate) / 100, 1)
          : Math.min(Math.max(opt.response_rate, 0), 1),
    // Clamp integer fields to safe ranges
    total_cycles: opt.total_cycles == null ? null : Math.min(Math.max(Math.round(opt.total_cycles), 1), 999),
    total_weeks: opt.total_weeks == null ? null : Math.min(Math.max(Math.round(opt.total_weeks), 1), 999),
    mst_days: opt.mst_days == null ? null : Math.min(Math.max(Math.round(opt.mst_days), 1), 99999),
    drugs: (opt.drugs ?? []).map((d) => ({
      ...d,
      route: DRUG_ROUTE_MAP[d.route?.toLowerCase()] ?? 'iv',
      dose_value: d.dose_value == null ? 0 : Math.min(Math.abs(d.dose_value), 99999),
      cycle_day: d.cycle_day == null ? 1 : Math.max(Math.round(d.cycle_day), 1),
      duration_days: d.duration_days == null ? 1 : Math.max(Math.round(d.duration_days), 1),
    })),
    adverse_effects: (opt.adverse_effects ?? []).map((ae) => ({
      ...ae,
      vcog_grade: Math.min(Math.max(Math.round(ae.vcog_grade ?? 1), 1), 5),
    })),
  }))
}

async function callClaudeAndSave(
  supabase: Awaited<ReturnType<typeof createClient>>,
  diagnosisName: string,
  hosId: string,
  diagnosisKey: string,
  isRescue = false,
): Promise<AiProtocolOption[]> {
  const client = getAnthropicClient()

  let response
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(diagnosisName, isRescue) }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('credit balance') || msg.includes('insufficient_quota')) {
      throw new Error('Anthropic API 크레딧이 부족합니다.')
    }
    throw new Error('AI 가이드 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  if (response.stop_reason === 'max_tokens') {
    console.error('[AI Guide] max_tokens reached. Partial response:', text.slice(-500))
    throw new Error('AI 응답이 너무 길어 잘렸습니다. 잠시 후 다시 시도해주세요.')
  }

  let parsed: { treatment_options: AiProtocolOption[] }
  try {
    parsed = extractJson(text)
  } catch {
    console.error('[AI Guide] JSON parse failed. stop_reason:', response.stop_reason, 'text tail:', text.slice(-300))
    throw new Error('AI 응답 파싱 오류. 다시 시도해주세요.')
  }

  const options = sanitizeProtocolOptions(parsed.treatment_options ?? [])

  // Save cache — scoped to hospital
  await supabase.from('onco_ai_cache').insert({
    diagnosis_key: diagnosisKey,
    hos_id: hosId,
    query_type: 'treatment_options',
    response_json: parsed as unknown as import('@/lib/supabase/database.types').Json,
    model_version: 'claude-sonnet-4-6',
    is_active: true,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // Upsert protocols
  const protocolRows = options.map((opt) => ({
    origin_diagnosis: diagnosisKey,
    protocol_name: opt.protocol_name,
    protocol_type: opt.protocol_type,
    phase: opt.phase,
    total_cycles: opt.total_cycles,
    total_weeks: opt.total_weeks,
    description: opt.description,
    mst_days: opt.mst_days,
    response_rate: opt.response_rate,
    drugs: opt.drugs as unknown as import('@/lib/supabase/database.types').Json,
    precautions: opt.precautions,
    adverse_effects: (opt.adverse_effects ?? []) as unknown as import('@/lib/supabase/database.types').Json,
    contraindications: opt.contraindications,
    owner_instructions: opt.owner_instructions,
    owner_warning_signs: (opt.owner_warning_signs ?? []) as unknown as import('@/lib/supabase/database.types').Json,
    ref_sources: (opt.ref_sources ?? []) as unknown as import('@/lib/supabase/database.types').Json,
    is_ai_generated: true,
    is_verified: false,
    hos_id: hosId,
    ai_model_version: 'claude-sonnet-4-6',
    drug_interactions: [] as unknown as import('@/lib/supabase/database.types').Json,
  }))

  // Upsert and get IDs directly from the return value
  const { data: upsertedProtocols, error: upsertError } = await supabase
    .from('onco_protocols')
    .upsert(protocolRows, { onConflict: 'origin_diagnosis,protocol_name,hos_id', ignoreDuplicates: false })
    .select('id, protocol_name')

  if (upsertError) {
    console.error('[Upsert] error:', upsertError.message)
  }

  // Fallback: if upsert didn't return rows, fetch separately
  let protocolMap: Map<string, string>
  if (upsertedProtocols && upsertedProtocols.length > 0) {
    protocolMap = new Map(upsertedProtocols.map((p) => [p.protocol_name, p.id]))
  } else {
    const { data: fetched } = await supabase
      .from('onco_protocols')
      .select('id, protocol_name')
      .eq('origin_diagnosis', diagnosisKey)
      .eq('hos_id', hosId)
    protocolMap = new Map((fetched ?? []).map((p) => [p.protocol_name, p.id]))
  }

  return options.map((opt) => ({
    ...opt,
    id: protocolMap.get(opt.protocol_name),
    is_ai_generated: true,
    is_verified: false,
    origin_diagnosis: diagnosisKey,
  }))
}

async function fetchProtocolsForKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  diagnosisKey: string,
  hosId: string,
): Promise<AiProtocolOption[]> {
  // Try with hos_id filter first, fallback to key-only for legacy rows
  const { data: withHos } = await supabase
    .from('onco_protocols')
    .select('*')
    .eq('origin_diagnosis', diagnosisKey)
    .eq('hos_id', hosId)
    .order('created_at', { ascending: true })

  if (withHos && withHos.length > 0) {
    return withHos.map(mapProtocolRow)
  }

  // Fallback: legacy rows without hos_id or with different hos_id
  const { data } = await supabase
    .from('onco_protocols')
    .select('*')
    .eq('origin_diagnosis', diagnosisKey)
    .order('created_at', { ascending: true })

  return (data ?? []).map(mapProtocolRow)
}

function mapProtocolRow(p: {
  id: string
  protocol_name: string
  protocol_type: string
  phase: string
  total_cycles: number | null
  total_weeks: number | null
  description: string | null
  mst_days: number | null
  response_rate: number | null
  drugs: unknown
  precautions: string | null
  adverse_effects: unknown
  contraindications: string | null
  owner_instructions: string | null
  owner_warning_signs: unknown
  ref_sources: unknown
  is_ai_generated: boolean
  is_verified: boolean
  origin_diagnosis: string | null
  user_tags?: string | null
}): AiProtocolOption {
  return {
    id: p.id,
    protocol_name: p.protocol_name,
    protocol_type: p.protocol_type,
    phase: p.phase,
    total_cycles: p.total_cycles,
    total_weeks: p.total_weeks,
    description: p.description,
    mst_days: p.mst_days,
    response_rate: p.response_rate,
    drugs: (p.drugs as DrugItem[]) ?? [],
    precautions: p.precautions,
    adverse_effects: (p.adverse_effects as AdverseEffectItem[]) ?? [],
    contraindications: p.contraindications,
    owner_instructions: p.owner_instructions,
    owner_warning_signs: (p.owner_warning_signs as string[]) ?? [],
    ref_sources: (p.ref_sources as RefSource[]) ?? [],
    is_ai_generated: p.is_ai_generated,
    is_verified: p.is_verified,
    origin_diagnosis: p.origin_diagnosis,
    user_tags: p.user_tags,
  }
}

export async function getProtocolsByDiagnosisKey(diagnosisKey: string, hosId: string): Promise<AiProtocolOption[]> {
  const supabase = await createClient()
  return fetchProtocolsForKey(supabase, diagnosisKey, hosId)
}

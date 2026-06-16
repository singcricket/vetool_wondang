'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { logAiUsage } from '@/lib/ai/log-usage'
import type { Database } from '@/lib/supabase/database.types'
import { getLabResults } from './lab-result-actions'
import { rewriteCommentWithVolume } from '@/lib/utils/icu/drug-calc'

type DxCertainty = Database['public']['Enums']['icu_dx_certainty']

function extractJsonObject<T = unknown>(text: string): T {
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  const start = stripped.indexOf('{')
  if (start === -1) {
    console.error('[extractJsonObject] JSON 시작 없음. 원문(앞 500자):', stripped.slice(0, 500))
    throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.')
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const candidate = stripped.slice(start, i + 1)
        try {
          return JSON.parse(candidate)
        } catch (e) {
          console.error('[extractJsonObject] 추출된 JSON 파싱 실패:', candidate.slice(0, 500), e)
          throw new Error('AI 응답 JSON 파싱 실패 (형식 오류)')
        }
      }
    }
  }
  console.error('[extractJsonObject] 균형 잡힌 중괄호 없음. 원문(앞 500자):', stripped.slice(0, 500))
  throw new Error('AI 응답 파싱 실패 (중괄호 미완성)')
}

// ── 타입 ──────────────────────────────────────────────────────

export type EvidenceLevel = 'standard' | 'latest' | 'experimental'

export type AiOrderSuggestion = {
  order_type: string
  order_name: string
  order_comment: string
  order_times: string[]
  ai_reasoning: string
  evidence_level: EvidenceLevel
  drug_in_hos_drugs: boolean
}

export type DrugInteraction = {
  drugs: string[]
  severity: 'low' | 'moderate' | 'high'
  description: string
}

export type SideEffectConcern = {
  drug: string
  concern: string
  monitoring: string
}

export type TreatmentReview = {
  overall_assessment: string
  drug_interactions: DrugInteraction[]
  side_effects: SideEffectConcern[]
  risks: string[]
}

export type AiSessionResult = {
  sessionId: string
  summary: string
  orders: AiOrderSuggestion[]
  treatment_review?: TreatmentReview
}

export type StoredAiOrder = {
  id: string
  session_id: string
  order_type: string
  order_name: string
  order_detail: {
    order_comment?: string
    order_times?: string[]
    summary?: string
  }
  ai_reasoning: string | null
  approval_status: Database['public']['Enums']['icu_ai_approval_status']
  approved_order_id: string | null
  drug_conc_mg_per_ml: number | null
  vet_comment: string | null
  reviewed_at: string | null
  created_at: string
}

export type StoredAiSession = {
  id: string
  icu_io_id: string
  dx_name: string
  dx_certainty: DxCertainty
  status: Database['public']['Enums']['icu_ai_session_status']
  context_snapshot: Record<string, unknown>
  ai_response: Record<string, unknown> | null
  created_at: string
  orders: StoredAiOrder[]
}

// ── 컨텍스트 스냅샷 빌드 ──────────────────────────────────────

export type VitalRecord = {
  name: string
  results: Array<{ time: number; result: string }>  // time: 0-23 (시간)
}

type DayChartHistory = {
  date: string          // YYYY-MM-DD
  day_number: number    // 입원 N일차
  orders: Array<{ type: string; name: string; comment: string | null }>
  vitals: VitalRecord[]
}

type ContextSnapshot = {
  patient: {
    name: string
    species: string
    breed: string
    weight: string
    age_in_days: number
  }
  icu_io_cc: string
  icu_io_dx: string
  dx_name: string
  dx_certainty: DxCertainty
  in_date: string
  target_date: string
  hospitalization_day: number
  chart_history: DayChartHistory[]   // 최근 7일 이전 차트 (target_date 제외)
  lab_results: Array<{ panel_type: string; items: Record<string, string>; tested_at: string | null; clinical_summary?: string | null }>
  current_orders: Array<{ type: string; name: string; comment: string | null }>
  current_vitals: VitalRecord[]
  additional_context?: string
}

// ── AI 추천 요청 ──────────────────────────────────────────────

export async function requestAiRecommendation(params: {
  icuIoId: string
  icuChartId: string
  hosId: string
  dxName: string
  dxCertainty: DxCertainty
  patientName: string
  species: string
  breed: string
  weight: string
  ageInDays: number
  icuIoCc: string
  icuIoDx: string
  inDate: string        // 입원일 YYYY-MM-DD
  targetDate: string    // 현재 차트 날짜 YYYY-MM-DD
  currentOrders: Array<{ type: string; name: string; comment: string | null }>
  currentVitals: VitalRecord[]
  additionalContext?: string
}): Promise<AiSessionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 입원 N일차 계산
  const inDateMs = new Date(params.inDate).getTime()
  const targetDateMs = new Date(params.targetDate).getTime()
  const hospitalizationDay = Math.floor((targetDateMs - inDateMs) / 86400000) + 1

  // 1. 최근 7일 이내 이전 차트 이력 조회 (target_date 제외)
  const sevenDaysAgo = new Date(targetDateMs - 7 * 86400000).toISOString().slice(0, 10)
  const { data: prevCharts } = await supabase
    .from('icu_charts')
    .select('icu_chart_id, target_date')
    .eq('icu_io_id', params.icuIoId)
    .lt('target_date', params.targetDate)
    .gte('target_date', sevenDaysAgo)
    .order('target_date', { ascending: true })

  const chartHistory: DayChartHistory[] = []
  if (prevCharts && prevCharts.length > 0) {
    const prevChartIds = prevCharts.map((c) => c.icu_chart_id)

    // 오더 + checklist 오더 ID 조회
    const { data: prevOrders } = await supabase
      .from('icu_orders')
      .select('icu_chart_order_id, icu_chart_id, icu_chart_order_type, icu_chart_order_name, icu_chart_order_comment')
      .in('icu_chart_id', prevChartIds)

    // checklist 오더의 처치 결과(바이탈) 조회
    const checklistOrderIds = (prevOrders ?? [])
      .filter((o) => o.icu_chart_order_type === 'checklist')
      .map((o) => o.icu_chart_order_id)

    const txMap = new Map<string, Array<{ time: number; result: string }>>()
    if (checklistOrderIds.length > 0) {
      const { data: txRows } = await supabase
        .from('icu_txs')
        .select('icu_chart_order_id, icu_chart_tx_result, time')
        .in('icu_chart_order_id', checklistOrderIds)
        .not('icu_chart_tx_result', 'is', null)
        .neq('icu_chart_tx_result', '')
        .neq('icu_chart_tx_result', '0')

      for (const tx of txRows ?? []) {
        if (!tx.icu_chart_order_id) continue
        const arr = txMap.get(tx.icu_chart_order_id) ?? []
        arr.push({ time: tx.time, result: tx.icu_chart_tx_result! })
        txMap.set(tx.icu_chart_order_id, arr)
      }
    }

    for (const chart of prevCharts) {
      const chartOrders = (prevOrders ?? []).filter((o) => o.icu_chart_id === chart.icu_chart_id)

      const dayOrders = chartOrders
        .filter((o) => o.icu_chart_order_type !== 'checklist')
        .map((o) => ({
          type: o.icu_chart_order_type,
          name: o.icu_chart_order_name,
          comment: o.icu_chart_order_comment ?? null,
        }))

      const dayVitals: VitalRecord[] = chartOrders
        .filter((o) => o.icu_chart_order_type === 'checklist')
        .map((o) => ({
          name: o.icu_chart_order_name,
          results: txMap.get(o.icu_chart_order_id) ?? [],
        }))
        .filter((v) => v.results.length > 0)

      const dayNumber = Math.floor((new Date(chart.target_date!).getTime() - inDateMs) / 86400000) + 1
      chartHistory.push({
        date: chart.target_date!,
        day_number: dayNumber,
        orders: dayOrders,
        vitals: dayVitals,
      })
    }
  }

  // 2. 최근 검사결과 로드
  const labResults = await getLabResults(params.icuIoId)

  const snapshot: ContextSnapshot = {
    patient: {
      name: params.patientName,
      species: params.species,
      breed: params.breed,
      weight: params.weight,
      age_in_days: params.ageInDays,
    },
    icu_io_cc: params.icuIoCc,
    icu_io_dx: params.icuIoDx,
    dx_name: params.dxName,
    dx_certainty: params.dxCertainty,
    in_date: params.inDate,
    target_date: params.targetDate,
    hospitalization_day: hospitalizationDay,
    chart_history: chartHistory,
    lab_results: labResults.map((r) => ({
      panel_type: r.panel_type,
      items: r.items,
      tested_at: r.tested_at,
      clinical_summary: r.clinical_summary ?? null,
    })),
    current_orders: params.currentOrders,
    current_vitals: params.currentVitals,
    additional_context: params.additionalContext,
  }

  // 2. 세션 레코드 생성 (pending 상태)
  const { data: sessionRow, error: sessionError } = await supabase
    .from('icu_ai_sessions')
    .insert({
      icu_io_id: params.icuIoId,
      icu_chart_id: params.icuChartId,
      hos_id: params.hosId,
      dx_name: params.dxName,
      dx_certainty: params.dxCertainty,
      context_snapshot: snapshot as any,
      status: 'pending',
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (sessionError) throw new Error(`세션 생성 실패: ${sessionError.message}`)
  const sessionId = sessionRow.id

  try {
    // 3. AI 호출
    const aiResponse = await callAiForOrders(snapshot, params.hosId)

    // 4. 세션 업데이트 (completed)
    await supabase
      .from('icu_ai_sessions')
      .update({ status: 'completed', ai_response: aiResponse as any })
      .eq('id', sessionId)

    // 5. 개별 오더 저장
    if (aiResponse.orders.length > 0) {
      const orderInserts = aiResponse.orders.map((order) => ({
        session_id: sessionId,
        icu_io_id: params.icuIoId,
        hos_id: params.hosId,
        order_type: order.order_type,
        order_name: order.order_name,
        order_detail: {
          order_comment: order.order_comment,
          order_times: order.order_times,
          summary: aiResponse.summary,
          evidence_level: order.evidence_level ?? 'standard',
        } as any,
        ai_reasoning: order.ai_reasoning,
        approval_status: 'pending' as const,
        drug_conc_mg_per_ml: order.drug_in_hos_drugs ? null : null,
      }))

      await supabase.from('icu_ai_orders').insert(orderInserts)
    }

    return {
      sessionId,
      summary: aiResponse.summary,
      orders: aiResponse.orders,
    }
  } catch (err: any) {
    await supabase
      .from('icu_ai_sessions')
      .update({ status: 'error', error_message: err?.message ?? 'AI 호출 실패' })
      .eq('id', sessionId)
    throw err
  }
}

// ── Claude 호출 ───────────────────────────────────────────────

async function callAiForOrders(
  ctx: ContextSnapshot,
  hosId: string,
): Promise<{ summary: string; orders: AiOrderSuggestion[] }> {
  const client = getAnthropicClient()

  const ageYears = (ctx.patient.age_in_days / 365).toFixed(1)
  const certLabel: Record<DxCertainty, string> = {
    confirmed: '확진',
    probable: '가진단',
    suspected: '추측',
    rule_out: '배제진단',
  }

  // 임상 요약: 중복 제거 후 합산 (여러 패널에 같은 요약이 붙어 있을 수 있음)
  const uniqueSummaries = [...new Set(
    ctx.lab_results.map((r) => r.clinical_summary).filter(Boolean) as string[]
  )]
  const clinicalSummarySection = uniqueSummaries.length > 0
    ? `\n━━ 임상 정보 요약 ━━\n${uniqueSummaries.join('\n')}`
    : ''

  const labSection =
    ctx.lab_results.length === 0
      ? '검사결과 없음'
      : ctx.lab_results
          .filter((r) => Object.keys(r.items).length > 0)
          .map(
            (r) =>
              `[${r.panel_type.toUpperCase()}${r.tested_at ? ` — ${r.tested_at.slice(0, 10)}` : ''}]\n` +
              Object.entries(r.items)
                .map(([k, v]) => `  ${k}: ${v}`)
                .join('\n'),
          )
          .join('\n\n') || '수치 검사결과 없음'

  const ordersSection =
    ctx.current_orders.length === 0
      ? '현재 오더 없음'
      : ctx.current_orders
          .map((o) => `- [${o.type}] ${o.name}${o.comment ? ` (${o.comment})` : ''}`)
          .join('\n')

  const formatVitals = (vitals: VitalRecord[]): string => {
    if (vitals.length === 0) return ''
    return vitals
      .map((v) => {
        const resultStr = v.results
          .sort((a, b) => a.time - b.time)
          .map((r) => `${String(r.time).padStart(2, '0')}시: ${r.result}`)
          .join(', ')
        return `  ${v.name}: ${resultStr}`
      })
      .join('\n')
  }

  const currentVitalsSection =
    ctx.current_vitals.length > 0
      ? `\n━━ ${ctx.target_date} 바이탈/처치 기록 ━━\n${formatVitals(ctx.current_vitals)}`
      : ''

  const historySection =
    ctx.chart_history.length === 0
      ? ''
      : '\n━━ 이전 차트 이력 (최근 7일) ━━\n' +
        ctx.chart_history
          .map((day) => {
            const orderLines =
              day.orders.length === 0
                ? '  (오더 없음)'
                : day.orders.map((o) => `  - [${o.type}] ${o.name}${o.comment ? ` (${o.comment})` : ''}`).join('\n')
            const vitalLines = formatVitals(day.vitals)
            const vitalBlock = vitalLines ? `\n  [바이탈/처치]\n${vitalLines}` : ''
            return `[${day.date} — 입원 ${day.day_number}일차]\n${orderLines}${vitalBlock}`
          })
          .join('\n\n')

  const prompt = `당신은 수의 내과 전문가입니다. 아래 입원 환자 정보를 바탕으로 치료 오더를 추천해주세요.

━━ 환자 정보 ━━
이름: ${ctx.patient.name}
종/품종: ${ctx.patient.species} / ${ctx.patient.breed}
나이: ${ageYears}세 (${ctx.patient.age_in_days}일)
체중: ${ctx.patient.weight} kg
입원일: ${ctx.in_date}
현재 차트: ${ctx.target_date} (입원 ${ctx.hospitalization_day}일차)

━━ 진단 ━━
주訴/주증상: ${ctx.icu_io_cc || '없음'}
기존 차트 진단명: ${ctx.icu_io_dx || '없음'}
현재 입력 진단명: ${ctx.dx_name} (${certLabel[ctx.dx_certainty]})
${historySection}
━━ 최근 검사결과 ━━
${labSection}
${clinicalSummarySection}
${currentVitalsSection}
━━ ${ctx.target_date} (입원 ${ctx.hospitalization_day}일차) 현재 처방 오더 ━━
${ordersSection}

${ctx.additional_context ? `━━ 추가 임상 정보 / 피드백 ━━\n${ctx.additional_context}\n` : ''}
━━ 지시사항 ━━
1. 입원 ${ctx.hospitalization_day}일차 차트 기준으로 오더를 추천하세요. 이전 차트 이력을 참고하여 치료 경과와 변화 추이를 반영하세요.${ctx.additional_context ? ' 위의 추가 임상 정보와 피드백을 반드시 반영하세요.' : ''}
2. 현재 이미 처방된 오더와 중복되지 않도록 주의하세요.
3. order_comment는 반드시 간결한 처방 지시문만 작성하세요. 설명·주의사항·근거는 ai_reasoning에 작성하세요.
4. 수액 order_comment 형식: "[속도] mL/hr IV CRI" 또는 "[속도] mL/hr IV CRI, 첨가제: [약품명] [용량]"처럼 핵심 처방 내용만. (예: "27 mL/hr IV CRI, 첨가제: KCl 20mEq/L + 비타민B 1mL")
5. 수액에 첨가하는 약물(비타민, 전해질, 포도당 등)은 별도 injection 오더로 추가하지 말고 수액 comment의 첨가제 항목에 포함하세요.
6. 주사 order_comment 형식: "[용량] mg/kg [경로] [횟수]" (예: "0.1 mg/kg IV SID"). 수액에 섞지 않고 독립적으로 투여하는 약물만 injection 오더로 작성하세요.
7. order_times는 하루 투여 횟수에 맞게 24시간 형식("0800", "1600", "2400" 등)으로 작성하세요.
8. drug_in_hos_drugs는 일반적으로 동물병원에 비치된 약물이면 true, 특수 약물이면 false로 설정하세요.
9. order_type은 다음 중 하나: fluid(수액), injection(주사), po(경구), checklist(체크), test(검사), feed(식이), manual(기타)
10. 최신 치료 프로토콜 및 약물을 적극 포함하세요. 단, 모든 오더에 반드시 evidence_level을 지정하세요:
    - "standard": 교과서적·정형화된 치료 (널리 검증된 표준 프로토콜)
    - "latest": 최근 수의학 문헌/가이드라인에 근거하며 임상 채택이 확산 중인 최신 프로토콜
    - "experimental": 사례보고·전임상 연구 등 근거가 제한적이거나 아직 표준화되지 않은 치료
11. evidence_level이 "latest" 또는 "experimental"인 오더의 ai_reasoning에는 반드시 근거 출처(저자·저널명·연도 또는 가이드라인명)를 포함하세요.
12. treatment_review: 현재 처방 오더 전체를 검토하여 다음을 작성하세요:
    - overall_assessment: 현재 치료의 전반적 평가 (1~3문장)
    - drug_interactions: 현재 오더 약물 간 상호작용. severity는 "low"(주의 수준), "moderate"(임상적으로 유의), "high"(심각한 위험) 중 하나. 상호작용이 없으면 빈 배열 []
    - side_effects: 현재 약물별 주요 부작용 우려 및 모니터링 항목. 중요한 것만 포함, 없으면 []
    - risks: 현재 환자 상태에서 특별히 주의해야 할 위험 요소 (문자열 배열). 없으면 []

JSON만 반환 (설명, 마크다운 없이):
{"summary":"치료 방향 요약","orders":[{"order_type":"fluid","order_name":"0.9% NaCl","order_comment":"27 mL/hr IV CRI, 첨가제: KCl 20mEq/L + 비타민B 1mL","order_times":[],"ai_reasoning":"저칼륨·고나트륨 교정 목적. 24시간당 Na 10mEq/L 이하로 서서히 교정. 2~4시간 후 전해질 재검사 필요.","evidence_level":"standard","drug_in_hos_drugs":true}],"treatment_review":{"overall_assessment":"현재 치료 평가 요약","drug_interactions":[{"drugs":["약물A","약물B"],"severity":"moderate","description":"상호작용 설명"}],"side_effects":[{"drug":"약물명","concern":"부작용 우려","monitoring":"모니터링 항목"}],"risks":["위험 요소 1"]}}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  logAiUsage({
    hosId,
    feature: 'icu_ai_orders',
    model: 'claude-sonnet-4-6',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
  console.log('[callAiForOrders] AI 원문 응답(앞 1000자):', rawText.slice(0, 1000))
  return extractJsonObject(rawText.trim())
}

// ── 세션 + 오더 조회 ─────────────────────────────────────────

export async function getLatestAiSession(
  icuIoId: string,
): Promise<StoredAiSession | null> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('icu_ai_sessions')
    .select('*')
    .eq('icu_io_id', icuIoId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !session) return null

  const { data: orders } = await supabase
    .from('icu_ai_orders')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  return {
    ...session,
    context_snapshot: session.context_snapshot as Record<string, unknown>,
    ai_response: session.ai_response as Record<string, unknown> | null,
    orders: (orders ?? []) as StoredAiOrder[],
  }
}

export async function getAiSessions(icuIoId: string): Promise<StoredAiSession[]> {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('icu_ai_sessions')
    .select('*')
    .eq('icu_io_id', icuIoId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!sessions || sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id)
  const { data: allOrders } = await supabase
    .from('icu_ai_orders')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })

  return sessions.map((session) => ({
    ...session,
    context_snapshot: session.context_snapshot as Record<string, unknown>,
    ai_response: session.ai_response as Record<string, unknown> | null,
    orders: ((allOrders ?? []) as StoredAiOrder[]).filter((o) => o.session_id === session.id),
  }))
}

// ── 시간 배열 빌드 ────────────────────────────────────────────
// icu_chart_order_time: 24칸 배열, 인덱스 = 시(0-23)
// 값 "0" = 미지정, 값 = 사용자 이름 = 해당 시각에 오더
function buildOrderTimeArray(aiTimes: string[], userName: string): string[] {
  const arr = Array(24).fill('0') as string[]
  for (const t of aiTimes) {
    // "0900" → 9, "21:00" → 21, "09" → 9
    const digits = t.replace(':', '').replace(/\D/g, '')
    if (!digits) continue
    const hour = parseInt(digits.slice(0, 2), 10)
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      arr[hour] = userName
    }
  }
  return arr
}

// ── 승인 ──────────────────────────────────────────────────────

export async function approveAiOrder(params: {
  aiOrderId: string
  hosId: string
  icuChartId: string
  orderType: string
  orderName: string
  orderComment: string
  orderTimes: string[]
  drugConcMgPerMl?: number | null
  patientWeightKg?: number | null
  vetComment?: string
}): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. 승인자 이름 조회
  let userName = '0'
  if (user?.id) {
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', user.id)
      .single()
    if (userData?.name) userName = userData.name
  }

  // 2. 24칸 시간 배열 생성 (AI 제안 시간 → 인덱스에 승인자 이름)
  const orderTimeArray = buildOrderTimeArray(params.orderTimes, userName)

  // 3. 농도 입력 시 comment 재작성 (mg → ml 변환)
  let finalComment = params.orderComment
  if (
    params.drugConcMgPerMl &&
    params.drugConcMgPerMl > 0 &&
    params.patientWeightKg &&
    params.patientWeightKg > 0
  ) {
    finalComment = rewriteCommentWithVolume(
      params.orderComment,
      params.patientWeightKg,
      params.drugConcMgPerMl,
    )
  }

  // 4. 실제 icu_order 생성
  const { data: orderData, error: orderError } = await supabase
    .from('icu_orders')
    .insert({
      hos_id: params.hosId,
      icu_chart_id: params.icuChartId,
      icu_chart_order_name: params.orderName,
      icu_chart_order_comment: finalComment || null,
      icu_chart_order_type: params.orderType,
      icu_chart_order_time: orderTimeArray,
    })
    .select('icu_chart_order_id')
    .single()

  if (orderError) throw new Error(`오더 생성 실패: ${orderError.message}`)

  // 4. ai_order 승인 처리
  await supabase
    .from('icu_ai_orders')
    .update({
      approval_status: 'approved',
      approved_order_id: orderData.icu_chart_order_id,
      drug_conc_mg_per_ml: params.drugConcMgPerMl ?? null,
      vet_comment: params.vetComment ?? null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.aiOrderId)

  return orderData.icu_chart_order_id
}

// ── 거절 ──────────────────────────────────────────────────────

export async function rejectAiOrder(params: {
  aiOrderId: string
  vetComment?: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('icu_ai_orders')
    .update({
      approval_status: 'rejected',
      vet_comment: params.vetComment ?? null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.aiOrderId)
}

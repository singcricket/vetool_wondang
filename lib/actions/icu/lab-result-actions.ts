'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { logAiUsage } from '@/lib/ai/log-usage'

function extractJsonObject<T = unknown>(text: string): T {
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  const start = stripped.indexOf('{')
  if (start === -1) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.')

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
      if (depth === 0) return JSON.parse(stripped.slice(start, i + 1))
    }
  }
  throw new Error('AI 응답 파싱 실패')
}

async function extractTextWithGoogleVision(base64: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) return ''
  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
        }),
      },
    )
    const data = await res.json()
    return data.responses?.[0]?.fullTextAnnotation?.text ?? ''
  } catch {
    return ''
  }
}

const LAB_EXTRACTION_PROMPT = `동물병원에서 받은 자료(검사결과지, 진료차트, 문진표 등)를 분석하여 JSON 하나만 반환하세요.

추출 항목:
1. lab_panels: 혈액/소변/응고 등 수치 검사 결과 배열 (없으면 빈 배열)
   - 날짜별로 분리: 표에 여러 날짜 컬럼이 있으면 날짜마다 별도 패널로 생성 (같은 panel_type이라도 날짜가 다르면 각각 독립 항목)
   - panel_type: "cbc"(전혈구: WBC/RBC/HGB/HCT/PLT 등), "chem"(혈청화학: BUN/CREA/ALT/ALP/TP/ALB/GLU/CHOL 등), "ua"(소변검사), "coag"(응고검사: PT/APTT/Fibrinogen 등), "other"(방사선·초음파 소견 등)
   - items: 해당 날짜의 검사 항목 키-값 객체. 키는 표준 영문 약어, 값은 "수치 단위" 문자열 (예: "12.3 ×10³/μL"). 이상 플래그(H/L) 있으면 값 끝에 포함 (예: "35.2% L")
   - tested_at: 검사일시 ISO 8601 (YYYY-MM-DDTHH:mm:ss). 시간 정보 없으면 날짜만 (YYYY-MM-DDT00:00:00). 날짜 불명이면 null

2. clinical_summary: 검사 수치 외 임상 정보를 한국어로 간결하게 요약한 문자열 (없으면 null)
   - 포함 내용: 주증상, 신체검사 소견, 활력징후(T/P/R/BW), 이전 진단 및 치료 이력, 문진 내용 등
   - 수치 검사 결과는 포함하지 말 것
   - 중요 임상 정보만 간결하게 요약 (2~5문장)

예시 — CBC 표에 6/24, 6/25, 6/26 세 컬럼이 있는 경우:
{"lab_panels":[{"panel_type":"cbc","items":{"WBC":"12.3 ×10³/μL H"},"tested_at":"2026-06-24T00:00:00"},{"panel_type":"cbc","items":{"WBC":"10.1 ×10³/μL"},"tested_at":"2026-06-25T00:00:00"},{"panel_type":"cbc","items":{"WBC":"9.4 ×10³/μL"},"tested_at":"2026-06-26T00:00:00"}],"clinical_summary":null}

JSON만 반환 (설명·마크다운 없이):`

export type ExtractedLabPanel = {
  panel_type: 'cbc' | 'chem' | 'ua' | 'coag' | 'other'
  items: Record<string, string>
  tested_at: string | null
}

export type ExtractedLabResult = {
  lab_panels: ExtractedLabPanel[]
  clinical_summary: string | null
  raw_text: string
  // 하위 호환
  panel_type: 'cbc' | 'chem' | 'ua' | 'coag' | 'other'
  items: Record<string, string>
  tested_at: string | null
}

export async function extractLabResultFromFile(params: {
  base64: string
  mediaType: string
  hosId: string
}): Promise<ExtractedLabResult> {
  const { base64, mediaType, hosId } = params
  const isPdf = mediaType === 'application/pdf'
  const client = getAnthropicClient()

  let contentBlocks: any[]
  let rawText = ''

  if (isPdf) {
    contentBlocks = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
      { type: 'text', text: LAB_EXTRACTION_PROMPT },
    ]
  } else {
    rawText = await extractTextWithGoogleVision(base64)
    if (rawText.trim()) {
      contentBlocks = [
        { type: 'text', text: `[OCR 추출 텍스트]\n${rawText}\n\n${LAB_EXTRACTION_PROMPT}` },
      ]
    } else {
      const imgType = mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      contentBlocks = [
        { type: 'image', source: { type: 'base64', media_type: imgType, data: base64 } },
        { type: 'text', text: LAB_EXTRACTION_PROMPT },
      ]
    }
  }

  const model = 'claude-haiku-4-5-20251001'
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  logAiUsage({
    hosId,
    feature: 'icu_lab_ocr',
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const parsed = extractJsonObject(text) as { lab_panels: ExtractedLabPanel[]; clinical_summary: string | null }

  const panels: ExtractedLabPanel[] = Array.isArray(parsed.lab_panels) ? parsed.lab_panels : []
  const first = panels[0] ?? { panel_type: 'other' as const, items: {}, tested_at: null }

  return {
    lab_panels: panels,
    clinical_summary: parsed.clinical_summary ?? null,
    raw_text: rawText,
    panel_type: first.panel_type,
    items: first.items,
    tested_at: first.tested_at,
  }
}

// ── 중복 체크 ──────────────────────────────────────────────────

export type DuplicateCheckResult = {
  key: string           // `${panel_type}__${tested_at}`
  isDuplicate: boolean
  existingId?: string
}

export async function checkDuplicatePanels(params: {
  icuIoId: string
  panels: Array<{ panelType: string; testedAt: string | null }>
}): Promise<DuplicateCheckResult[]> {
  const supabase = await createClient()

  // tested_at이 있는 패널만 중복 체크 (null은 항상 신규로 간주)
  const datedPanels = params.panels.filter((p) => p.testedAt !== null)
  if (datedPanels.length === 0) {
    return params.panels.map((p) => ({
      key: `${p.panelType}__${p.testedAt}`,
      isDuplicate: false,
    }))
  }

  const { data: existing } = await supabase
    .from('icu_lab_results')
    .select('id, panel_type, tested_at')
    .eq('icu_io_id', params.icuIoId)
    .in('panel_type', datedPanels.map((p) => p.panelType))
    .not('tested_at', 'is', null)

  // 날짜 비교는 날짜 부분(YYYY-MM-DD)만 비교 (시간 무시)
  const existingMap = new Map<string, string>()
  for (const row of existing ?? []) {
    const dateKey = `${row.panel_type}__${row.tested_at!.slice(0, 10)}`
    existingMap.set(dateKey, row.id)
  }

  return params.panels.map((p) => {
    if (!p.testedAt) return { key: `${p.panelType}__null`, isDuplicate: false }
    const dateKey = `${p.panelType}__${p.testedAt.slice(0, 10)}`
    const existingId = existingMap.get(dateKey)
    return {
      key: dateKey,
      isDuplicate: !!existingId,
      existingId,
    }
  })
}

// ── 타입 ──────────────────────────────────────────────────────

export type LabResult = {
  id: string
  icu_io_id: string
  icu_chart_id: string | null
  panel_type: string
  items: Record<string, string>
  source_type: string
  tested_at: string | null
  clinical_summary: string | null
  created_at: string
}

export async function getLabResults(icuIoId: string): Promise<LabResult[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('icu_lab_results')
    .select('id, icu_io_id, icu_chart_id, panel_type, items, source_type, tested_at, clinical_summary, created_at')
    .eq('icu_io_id', icuIoId)
    .order('tested_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(`검사결과 조회 실패: ${error.message}`)
  return (data ?? []) as LabResult[]
}

export async function saveLabResult(params: {
  icuIoId: string
  icuChartId: string | null
  hosId: string
  panelType: string
  items: Record<string, string>
  rawText?: string
  clinicalSummary?: string | null
  sourceType: 'manual' | 'ocr' | 'pdf'
  testedAt: string | null
}): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('icu_lab_results')
    .insert({
      icu_io_id: params.icuIoId,
      icu_chart_id: params.icuChartId,
      hos_id: params.hosId,
      panel_type: params.panelType,
      items: params.items as any,
      raw_text: params.rawText ?? null,
      clinical_summary: params.clinicalSummary ?? null,
      source_type: params.sourceType,
      tested_at: params.testedAt,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`검사결과 저장 실패: ${error.message}`)
  return data.id
}

export type SaveMultipleResult = {
  savedIds: string[]
  skippedCount: number    // 중복으로 건너뜀
  overwrittenCount: number
}

export async function saveMultipleLabResults(params: {
  icuIoId: string
  icuChartId: string | null
  hosId: string
  panels: Array<{
    panelType: string
    items: Record<string, string>
    testedAt: string | null
    overwrite?: boolean    // true면 기존 레코드 덮어쓰기
  }>
  clinicalSummary?: string | null
  rawText?: string
  sourceType: 'manual' | 'ocr' | 'pdf'
}): Promise<SaveMultipleResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 중복 체크
  const dupCheck = await checkDuplicatePanels({
    icuIoId: params.icuIoId,
    panels: params.panels.map((p) => ({ panelType: p.panelType, testedAt: p.testedAt })),
  })

  const savedIds: string[] = []
  let skippedCount = 0
  let overwrittenCount = 0
  let clinicalSummaryAssigned = false

  for (let i = 0; i < params.panels.length; i++) {
    const p = params.panels[i]
    const dup = dupCheck[i]

    const clinicalSummaryForRow = !clinicalSummaryAssigned
      ? (params.clinicalSummary ?? null)
      : null

    if (dup.isDuplicate && !p.overwrite) {
      skippedCount++
      // 임상 요약은 기존 레코드에도 없을 수 있으므로 첫 번째 중복 패널에 요약 업데이트
      if (!clinicalSummaryAssigned && params.clinicalSummary && dup.existingId) {
        await supabase
          .from('icu_lab_results')
          .update({ clinical_summary: params.clinicalSummary })
          .eq('id', dup.existingId)
          .is('clinical_summary', null)
        clinicalSummaryAssigned = true
      }
      continue
    }

    if (dup.isDuplicate && p.overwrite && dup.existingId) {
      // 기존 레코드 덮어쓰기
      const { error } = await supabase
        .from('icu_lab_results')
        .update({
          items: p.items as any,
          raw_text: params.rawText ?? null,
          clinical_summary: clinicalSummaryForRow,
          source_type: params.sourceType,
          tested_at: p.testedAt,
        })
        .eq('id', dup.existingId)

      if (!error) {
        savedIds.push(dup.existingId)
        overwrittenCount++
        clinicalSummaryAssigned = true
      }
    } else {
      // 신규 INSERT
      const { data, error } = await supabase
        .from('icu_lab_results')
        .insert({
          icu_io_id: params.icuIoId,
          icu_chart_id: params.icuChartId,
          hos_id: params.hosId,
          panel_type: p.panelType,
          items: p.items as any,
          raw_text: params.rawText ?? null,
          clinical_summary: clinicalSummaryForRow,
          source_type: params.sourceType,
          tested_at: p.testedAt,
          created_by: user?.id ?? null,
        })
        .select('id')
        .single()

      if (!error && data) {
        savedIds.push(data.id)
        clinicalSummaryAssigned = true
      }
    }
  }

  return { savedIds, skippedCount, overwrittenCount }
}

export async function deleteLabResult(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('icu_lab_results').delete().eq('id', id)
  if (error) throw new Error(`검사결과 삭제 실패: ${error.message}`)
}

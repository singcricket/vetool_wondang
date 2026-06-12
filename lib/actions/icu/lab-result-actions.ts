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
   - panel_type: "cbc"(전혈구: WBC/RBC/HGB/HCT/PLT 등), "chem"(혈청화학: BUN/CREA/ALT/ALP/TP/ALB/GLU/CHOL 등), "ua"(소변검사), "coag"(응고검사: PT/APTT/Fibrinogen 등), "other"(방사선·초음파 소견 등)
   - items: 검사 항목 키-값 객체. 키는 표준 영문 약어, 값은 "수치 단위" 문자열 (예: "12.3 ×10³/μL"). 이상 플래그(H/L) 있으면 값 끝에 포함 (예: "35.2% L")
   - tested_at: 검사일시 ISO 8601 (YYYY-MM-DDTHH:mm:ss), 없으면 null

2. clinical_summary: 검사 수치 외 임상 정보를 한국어로 간결하게 요약한 문자열 (없으면 null)
   - 포함 내용: 주증상, 신체검사 소견, 활력징후(T/P/R/BW), 이전 진단 및 치료 이력, 문진 내용 등
   - 수치 검사 결과는 포함하지 말 것 (위 lab_panels에 포함됨)
   - 중요 임상 정보만 간결하게 요약 (2~5문장)

JSON만 반환 (설명·마크다운 없이):
{"lab_panels":[{"panel_type":"cbc","items":{},"tested_at":null}],"clinical_summary":null}`

export type ExtractedLabPanel = {
  panel_type: 'cbc' | 'chem' | 'ua' | 'coag' | 'other'
  items: Record<string, string>
  tested_at: string | null
}

export type ExtractedLabResult = {
  lab_panels: ExtractedLabPanel[]
  clinical_summary: string | null
  raw_text: string
  // 하위 호환: 단일 패널 뷰를 위해 첫 번째 패널 정보도 노출
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
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      },
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

export async function saveMultipleLabResults(params: {
  icuIoId: string
  icuChartId: string | null
  hosId: string
  panels: Array<{ panelType: string; items: Record<string, string>; testedAt: string | null }>
  clinicalSummary?: string | null
  rawText?: string
  sourceType: 'manual' | 'ocr' | 'pdf'
}): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const inserts = params.panels.map((p, idx) => ({
    icu_io_id: params.icuIoId,
    icu_chart_id: params.icuChartId,
    hos_id: params.hosId,
    panel_type: p.panelType,
    items: p.items as any,
    raw_text: params.rawText ?? null,
    // 임상 요약은 첫 번째 패널에만 저장 (중복 방지)
    clinical_summary: idx === 0 ? (params.clinicalSummary ?? null) : null,
    source_type: params.sourceType,
    tested_at: p.testedAt,
    created_by: user?.id ?? null,
  }))

  const { data, error } = await supabase
    .from('icu_lab_results')
    .insert(inserts)
    .select('id')

  if (error) throw new Error(`검사결과 저장 실패: ${error.message}`)
  return (data ?? []).map((d) => d.id)
}

export async function deleteLabResult(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('icu_lab_results').delete().eq('id', id)
  if (error) throw new Error(`검사결과 삭제 실패: ${error.message}`)
}

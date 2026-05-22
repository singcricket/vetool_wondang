'use server'

import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { findLabRefByKeyword } from '@/constants/hospital/checkup/lab-ref'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-ref'

// ────────────────────────────────────────────────────────────
// JSON 파싱 헬퍼 (oncology 패턴 재사용)
// ────────────────────────────────────────────────────────────
function extractJson<T = unknown>(text: string): T {
  try { return JSON.parse(text.trim()) } catch {}

  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

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

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────
export type FileInput = {
  base64: string
  mediaType: string
  fileName: string
}

export type ExtractedInquiry = {
  chief_complaint: string
  history: string
  living_env: string
  diet: string
  current_medications: string
}

export type ExtractedPhysical = {
  body_weight: string
  bcs: string
  temperature: string
  pulse: string
  respiration: string
}

export type ExtractedLabRaw = {
  nameEn: string
  value: string
  unit: string
  ref_range: string
  is_abnormal: boolean | null
}

export type PdfExtractionResult = {
  inquiry: ExtractedInquiry
  physical: ExtractedPhysical
  lab_items: LabResultItem[]     // ref 매핑 완료된 항목
  unmatched_lab: ExtractedLabRaw[] // ref 매핑 실패 항목
}

// ────────────────────────────────────────────────────────────
// 추출 프롬프트
// ────────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are an expert veterinary clinician analyzing veterinary medical records and lab reports.

Extract all available information from the provided document(s) and return ONLY valid JSON with this exact structure:

{
  "inquiry": {
    "chief_complaint": "주증상/내원 이유 (한국어)",
    "history": "병력, 과거 수술/질환, 예방접종 이력 등 (한국어)",
    "living_env": "생활환경 정보 (실내/실외, 동거동물 등, 한국어)",
    "diet": "식이 정보 (현재 급여 사료 종류/브랜드, 급여량, 횟수, 간식 등, 한국어)",
    "current_medications": "현재 투여 중인 약물 및 보조제 (한국어)"
  },
  "physical": {
    "body_weight": "숫자만 (예: 5.2)",
    "bcs": "숫자만 1-9",
    "temperature": "숫자만 섭씨 (예: 38.5)",
    "pulse": "숫자만 (예: 100)",
    "respiration": "숫자만 (예: 24)"
  },
  "lab_items": [
    {
      "nameEn": "검사항목 영문명 (예: ALT, WBC, Creatinine)",
      "value": "수치 (숫자만, 예: 120)",
      "unit": "단위 (예: U/L)",
      "ref_range": "참고범위 원문 그대로 (예: 10-88 또는 10.0-88.0)",
      "is_abnormal": true 또는 false 또는 null
    }
  ]
}

Rules:
- Extract ALL lab values present in the document, including CBC, chemistry, urinalysis, endocrine, special tests
- For is_abnormal: true if marked as H/L/↑/↓/abnormal, false if explicitly normal, null if unclear
- If a field has no information in the document, use empty string "" for text fields, empty array [] for lab_items
- For physical values, extract numbers only without units
- nameEn should be standard abbreviations (ALT not Alanine Aminotransferase)
- Do not include any text outside the JSON object`

// ────────────────────────────────────────────────────────────
// 메인 액션
// ────────────────────────────────────────────────────────────
const BUCKET = 'checkup-documents'
const MAX_FILES = 5

export async function extractCheckupFromPdf(
  checkupId: string,
  hosId: string,
  files: FileInput[],
): Promise<PdfExtractionResult> {
  if (files.length === 0) throw new Error('파일을 선택해주세요.')
  if (files.length > MAX_FILES) throw new Error(`파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`)

  const supabase = await createClient()
  const client = getAnthropicClient()

  // 1. Storage 업로드 (non-fatal)
  await Promise.all(
    files.map(async (file) => {
      try {
        const ts = Date.now()
        const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${hosId}/${checkupId}/${ts}_${safeName}`
        const buffer = Buffer.from(file.base64, 'base64')
        await supabase.storage
          .from(BUCKET)
          .upload(path, buffer, { contentType: file.mediaType, upsert: false })
      } catch {}
    }),
  )

  // 2. Claude 호출
  const fileBlocks = files.flatMap((f, i) => {
    const docBlock =
      f.mediaType === 'application/pdf'
        ? {
            type: 'document' as const,
            source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: f.base64 },
          }
        : {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: f.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
              data: f.base64,
            },
          }
    return [
      { type: 'text' as const, text: `[문서 ${i + 1}/${files.length}: ${f.fileName}]` },
      docBlock,
    ]
  })

  let response
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [...fileBlocks, { type: 'text' as const, text: EXTRACTION_PROMPT }],
        },
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('credit balance') || msg.includes('insufficient_quota')) {
      throw new Error('Anthropic API 크레딧이 부족합니다.')
    }
    throw new Error('문서 분석 중 오류가 발생했습니다. 다시 시도해주세요.')
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  let parsed: {
    inquiry: ExtractedInquiry
    physical: ExtractedPhysical
    lab_items: ExtractedLabRaw[]
  }
  try {
    parsed = extractJson(text)
  } catch {
    throw new Error('AI 응답 파싱 오류. 다시 시도해주세요.')
  }

  // 3. lab_items → ref 매핑
  const matched: LabResultItem[] = []
  const unmatched: ExtractedLabRaw[] = []

  for (const raw of parsed.lab_items ?? []) {
    const ref = findLabRefByKeyword(raw.nameEn)
    if (ref) {
      matched.push({
        id: ref.id,
        nameEn: ref.nameEn,
        nameKo: ref.nameKo,
        unit: raw.unit || ref.unit,
        value: raw.value || null,
        ref_range: raw.ref_range || null,
        is_abnormal: raw.is_abnormal ?? null,
        result_text: null,
        severity: null,
        comment: null,
        source: 'ai' as const,
        section: ref.section,
      })
    } else {
      unmatched.push(raw)
    }
  }

  return {
    inquiry: {
      chief_complaint: parsed.inquiry?.chief_complaint ?? '',
      history: parsed.inquiry?.history ?? '',
      living_env: parsed.inquiry?.living_env ?? '',
      diet: parsed.inquiry?.diet ?? '',
      current_medications: parsed.inquiry?.current_medications ?? '',
    },
    physical: {
      body_weight: parsed.physical?.body_weight ?? '',
      bcs: parsed.physical?.bcs ?? '',
      temperature: parsed.physical?.temperature ?? '',
      pulse: parsed.physical?.pulse ?? '',
      respiration: parsed.physical?.respiration ?? '',
    },
    lab_items: matched,
    unmatched_lab: unmatched,
  }
}

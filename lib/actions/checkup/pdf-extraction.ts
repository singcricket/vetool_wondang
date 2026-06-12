'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { findLabRefByKeyword } from '@/constants/hospital/checkup/lab-ref'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-ref'

// ── Google Vision OCR (이미지 전용) ──────────────────────────
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

// ────────────────────────────────────────────────────────────
// JSON 파싱 헬퍼
// ────────────────────────────────────────────────────────────
function extractJson<T = unknown>(text: string): T {
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  const start = stripped.indexOf('{')
  if (start === -1) {
    console.error('[extractJson] JSON 시작 없음. 원문(앞 500자):', stripped.slice(0, 500))
    throw new Error('No JSON object found in response')
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
          console.error('[extractJson] 추출된 JSON 파싱 실패 (앞 500자):', candidate.slice(0, 500), e)
          throw new Error('Extracted JSON is malformed')
        }
      }
    }
  }

  console.error('[extractJson] 중괄호 미완성. 원문 길이:', stripped.length, '/ 앞 500자:', stripped.slice(0, 500))
  throw new Error('No valid JSON object found in response (possibly truncated)')
}

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────

/** 클라이언트 → 서버 액션: 파일 1개의 base64 데이터 */
export type FileInput = {
  base64: string
  mediaType: string
  fileName: string
}

/** Storage에 업로드 완료된 파일 참조 */
export type StorageFileInput = {
  storagePath: string
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
  systolic_bp: string
  diastolic_bp: string
}

export type ExtractedLabRaw = {
  nameEn: string
  value: string
  unit: string
  ref_range: string
  is_abnormal: boolean | null
}

export type ExtractedImaging = {
  thorax_notes: string
  abdomen_notes: string
  extremity_notes: string
  skull_notes: string
  spine_notes: string
}

export type PdfExtractionResult = {
  inquiry: ExtractedInquiry
  physical: ExtractedPhysical
  lab_items: LabResultItem[]
  unmatched_lab: ExtractedLabRaw[]
  imaging: ExtractedImaging
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
    "respiration": "숫자만 (예: 24)",
    "systolic_bp": "수축기 혈압 숫자만 mmHg (예: 140). BP가 단일값이면 여기에 입력",
    "diastolic_bp": "이완기 혈압 숫자만 mmHg (예: 85). 없으면 빈 문자열"
  },
  "lab_items": [
    {
      "nameEn": "검사항목 영문명 표준 약어 (예: ALT, WBC, Creatinine)",
      "value": "수치 (숫자만, 예: 120)",
      "unit": "단위 (예: U/L)",
      "ref_range": "참고범위 원문 그대로 (예: 10-88 또는 10.0-88.0)",
      "is_abnormal": true 또는 false 또는 null
    }
  ],
  "imaging": {
    "thorax_notes": "흉부 방사선 소견 텍스트 (한국어, 없으면 빈 문자열)",
    "abdomen_notes": "복부 방사선 소견 텍스트 (한국어, 없으면 빈 문자열)",
    "extremity_notes": "사지 방사선 소견 텍스트 (한국어, 없으면 빈 문자열)",
    "skull_notes": "두개골 방사선 소견 텍스트 (한국어, 없으면 빈 문자열)",
    "spine_notes": "척추 방사선 소견 텍스트 (한국어, 없으면 빈 문자열)"
  }
}

Rules:
- Extract ALL lab values present in the document, including CBC, chemistry, urinalysis, endocrine, special tests
- For is_abnormal: true if marked as H/L/↑/↓/abnormal, false if explicitly normal, null if unclear
- If a field has no information in the document, use empty string "" for text fields, empty array [] for lab_items
- For physical values, extract numbers only without units
- nameEn MUST use standardized abbreviations. Apply these normalizations:
  ALKP / ALKPH / SAP / AP → ALP
  SGPT / GPT → ALT
  SGOT / GOT → AST
  GAMMA-GT / γ-GT / GGTP → GGT
  TBIL / T-BIL → T.Bil
  DBIL / D-BIL → D.Bil
  UREA → BUN
  CREA / CRE / CREAT → Creatinine
  T-CHOL / TCHO / TC → Cholesterol
  TG / TRG → Triglyceride
  HCT / Hematocrit → PCV
  LEUKO → WBC
  PLT / Platelet / Thrombocyte → PLT
  NEU / SEG → Neut
  LYM → Lymph
  EOS → Eosino
  Use the standardized name even if the document uses a different abbreviation.
- For imaging: extract any radiology/X-ray findings text per body region; use empty string if not present
- Do not include any text outside the JSON object`

// ────────────────────────────────────────────────────────────
// STEP 1: 파일 1개를 Storage에 업로드하고 path 반환
//   클라이언트에서 파일당 1번씩 호출 → Vercel 4.5MB 제한 우회
// ────────────────────────────────────────────────────────────
const BUCKET = 'checkup-documents'
const MAX_FILES = 5

export async function uploadCheckupFile(
  checkupId: string,
  hosId: string,
  file: FileInput,
): Promise<{ data: StorageFileInput | null; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const ts = Date.now()
    const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${hosId}/${checkupId}/${ts}_${safeName}`

    const buffer = Buffer.from(file.base64, 'base64')
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.mediaType, upsert: false })

    if (error) {
      console.error('[uploadCheckupFile] storage error:', error.message)
      return { data: null, error: `파일 업로드 실패: ${file.fileName} — ${error.message}` }
    }

    return { data: { storagePath, mediaType: file.mediaType, fileName: file.fileName }, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadCheckupFile] unexpected error:', msg)
    return { data: null, error: `파일 업로드 중 오류: ${msg}` }
  }
}

// ────────────────────────────────────────────────────────────
// STEP 2: Storage에 업로드된 파일들을 AI로 분석
// ────────────────────────────────────────────────────────────
export async function extractCheckupFromPdf(
  _checkupId: string,
  _hosId: string,
  files: StorageFileInput[],
): Promise<{ data: PdfExtractionResult | null; error: string | null }> {
  try {
    if (files.length === 0) return { data: null, error: '파일을 선택해주세요.' }
    if (files.length > MAX_FILES) return { data: null, error: `파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.` }

    const supabase = createAdminClient()
    const client = getAnthropicClient()

    // 1. Storage에서 파일 다운로드 → base64 변환
    const fileDataArray = await Promise.all(
      files.map(async (f) => {
        const { data, error } = await supabase.storage.from(BUCKET).download(f.storagePath)
        if (error || !data) throw new Error(`파일 다운로드 실패: ${f.fileName} — ${error?.message ?? 'unknown'}`)
        const buffer = Buffer.from(await data.arrayBuffer())
        return { ...f, base64: buffer.toString('base64') }
      }),
    )

    // 2. 이미지 파일: Google Vision OCR 병렬 처리
    const ocrResults = await Promise.all(
      fileDataArray.map((f) =>
        f.mediaType.startsWith('image/')
          ? extractTextWithGoogleVision(f.base64)
          : Promise.resolve(''),
      ),
    )

    // 3. Claude 호출 블록 구성
    const fileBlocks: Array<{ type: string; [key: string]: unknown }> = []
    for (let i = 0; i < fileDataArray.length; i++) {
      const f = fileDataArray[i]
      const ocrText = ocrResults[i]
      fileBlocks.push({ type: 'text', text: `[문서 ${i + 1}/${fileDataArray.length}: ${f.fileName}]` })

      if (f.mediaType === 'application/pdf') {
        fileBlocks.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: f.base64 },
        })
      } else if (ocrText) {
        fileBlocks.push({ type: 'text', text: `[OCR 추출 텍스트]\n${ocrText}` })
      } else {
        fileBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: f.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
            data: f.base64,
          },
        })
      }
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [...fileBlocks, { type: 'text' as const, text: EXTRACTION_PROMPT }] as any,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: {
      inquiry: ExtractedInquiry
      physical: ExtractedPhysical
      lab_items: ExtractedLabRaw[]
      imaging?: ExtractedImaging
    }
    try {
      parsed = extractJson(text)
    } catch {
      return { data: null, error: 'AI 응답 파싱 오류. 다시 시도해주세요.' }
    }

    // 4. lab_items → ref 매핑
    const matched: LabResultItem[] = []
    const matchedIds = new Set<string>()
    const unmatched: ExtractedLabRaw[] = []

    for (const raw of parsed.lab_items ?? []) {
      const ref = findLabRefByKeyword(raw.nameEn)
      if (ref) {
        if (matchedIds.has(ref.id)) continue
        matchedIds.add(ref.id)
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
      data: {
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
          systolic_bp: parsed.physical?.systolic_bp ?? '',
          diastolic_bp: parsed.physical?.diastolic_bp ?? '',
        },
        lab_items: matched,
        unmatched_lab: unmatched,
        imaging: {
          thorax_notes: parsed.imaging?.thorax_notes ?? '',
          abdomen_notes: parsed.imaging?.abdomen_notes ?? '',
          extremity_notes: parsed.imaging?.extremity_notes ?? '',
          skull_notes: parsed.imaging?.skull_notes ?? '',
          spine_notes: parsed.imaging?.spine_notes ?? '',
        },
      },
      error: null,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[extractCheckupFromPdf] error:', msg)
    if (msg.includes('credit balance') || msg.includes('insufficient_quota')) {
      return { data: null, error: 'Anthropic API 크레딧이 부족합니다.' }
    }
    return { data: null, error: `문서 분석 오류: ${msg}` }
  }
}

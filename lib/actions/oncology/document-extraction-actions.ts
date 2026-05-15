'use server'

import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'

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

const BUCKET = 'oncology-documents'
const MAX_FILES = 10

export type UploadedFileInfo = {
  name: string
  url: string | null
  mediaType: string
}

export type ExtractedDiagnosisFields = {
  clinical_signs: string
  clinical_course: string
  raw_text: string
  uploadedFiles: UploadedFileInfo[]
}

export type FileInput = {
  base64: string
  mediaType: string
  fileName: string
}

const EXTRACTION_PROMPT = `You are an expert veterinary clinician. You have been given one or more veterinary diagnosis documents (cytology reports, biopsy results, CT/imaging reports, bloodwork, etc.).

Synthesize ALL provided documents and extract the following information.

Return ONLY valid JSON with this exact structure:
{
  "clinical_signs": "관찰된 임상 증상들 (한국어로 정리)",
  "clinical_course": "질환의 경과 및 진행 과정 (한국어로 정리)",
  "raw_text": "검사 결과, 수치, 소견 등 추가 중요 정보 (한국어로 정리)"
}

Rules:
- Synthesize information from ALL documents, not just the first one
- If a section has no relevant content, return an empty string ""
- Summarize and organize the content clearly in Korean
- Include specific values (measurements, lab results, dates, pathology findings) in the appropriate field
- Do not include any text outside the JSON object`

function buildContentBlock(file: FileInput) {
  if (file.mediaType === 'application/pdf') {
    return {
      type: 'document' as const,
      source: {
        type: 'base64' as const,
        media_type: 'application/pdf' as const,
        data: file.base64,
      },
    }
  }
  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: file.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: file.base64,
    },
  }
}

export async function uploadAndExtractDiagnosis(
  caseId: string,
  hosId: string,
  files: FileInput[],
): Promise<ExtractedDiagnosisFields> {
  if (files.length === 0) throw new Error('파일을 선택해주세요.')
  if (files.length > MAX_FILES) throw new Error(`파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`)

  const supabase = await createClient()
  const client = getAnthropicClient()

  // 1. Upload all files to Storage in parallel (non-fatal)
  const uploadedFiles: UploadedFileInfo[] = await Promise.all(
    files.map(async (file) => {
      try {
        const ts = Date.now()
        const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${hosId}/${caseId}/${ts}_${safeName}`
        const buffer = Buffer.from(file.base64, 'base64')

        const { data, error } = await supabase.storage
          .from(BUCKET)
          .upload(path, buffer, { contentType: file.mediaType, upsert: false })

        if (error || !data) return { name: file.fileName, url: null, mediaType: file.mediaType }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
        return { name: file.fileName, url: urlData.publicUrl, mediaType: file.mediaType }
      } catch {
        return { name: file.fileName, url: null, mediaType: file.mediaType }
      }
    }),
  )

  // 2. Build Claude content — all files first, then the extraction prompt
  const fileBlocks = files.map((f, i) => {
    const block = buildContentBlock(f)
    // Wrap in an array with a label text block so Claude knows which doc it is
    return [
      { type: 'text' as const, text: `[문서 ${i + 1}/${files.length}: ${f.fileName}]` },
      block,
    ]
  }).flat()

  let response
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            ...fileBlocks,
            { type: 'text' as const, text: EXTRACTION_PROMPT },
          ],
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

  let parsed: { clinical_signs: string; clinical_course: string; raw_text: string }
  try {
    parsed = extractJson(text)
  } catch {
    throw new Error('AI 응답 파싱 오류. 다시 시도해주세요.')
  }

  // 3. Upsert to onco_diagnosis_inputs (one 'document' row per case)
  const firstFile = uploadedFiles[0]
  await supabase.from('onco_diagnosis_inputs').upsert(
    {
      case_id: caseId,
      input_type: 'document',
      clinical_signs: parsed.clinical_signs || null,
      clinical_course: parsed.clinical_course || null,
      raw_text: parsed.raw_text || null,
      ai_extracted_text: text,
      file_url: firstFile.url,
      file_name: files.map((f) => f.fileName).join(', '),
      file_type: files.map((f) => f.mediaType).join(', '),
      additional_notes: JSON.stringify(uploadedFiles),
    },
    { onConflict: 'case_id,input_type' },
  )

  return {
    clinical_signs: parsed.clinical_signs ?? '',
    clinical_course: parsed.clinical_course ?? '',
    raw_text: parsed.raw_text ?? '',
    uploadedFiles,
  }
}

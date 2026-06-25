'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { revalidatePath } from 'next/cache'
import { findLabRefByKeyword } from '@/constants/hospital/checkup/lab-ref'
import { evaluateLabValue } from '@/lib/utils/lab-evaluate'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'
import type { BlogLabSession, BlogPatient } from '@/types/hospital/blog-type'

const PDF_BUCKET = 'blog-pdfs'

// ── 추출 결과 타입 ─────────────────────────────────────────────

export type BlogExtractedSection = {
  title_vet: string
  body_vet: string
  title_owner: string
  body_owner: string
}

type RawLabItem = { nameEn: string; value: string; unit: string; ref_range: string; is_abnormal: boolean | null }

type ExtractedPatient = {
  hos_patient_id: string
  name: string
  species: string
  breed: string
  gender: string
  birth: string
  owner_name: string
}

export type BlogPdfExtractionResult = {
  diagnosis: string
  summary: string
  species: string
  sections: BlogExtractedSection[]
  lab_sessions: BlogLabSession[]
  unmatched_lab: RawLabItem[]
  patient: (BlogPatient & { is_new: boolean }) | null
}

// ── Claude 프롬프트 ────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are an expert veterinary clinician. Analyze the provided veterinary medical record or lab report and return ONLY valid JSON.

Return this exact structure:
{
  "diagnosis": "진단명 (한국어, 없으면 빈 문자열)",
  "summary": "케이스 한줄 요약 (한국어, 2–3문장 이내)",
  "species": "canine | feline | exotic | etc (추정 불가 시 빈 문자열)",
  "patient": {
    "hos_patient_id": "병원 차트 번호 / 환자 ID (없으면 빈 문자열)",
    "name": "동물 이름 (없으면 빈 문자열)",
    "species": "canine | feline | exotic | etc (없으면 빈 문자열)",
    "breed": "품종 (없으면 빈 문자열)",
    "gender": "M | F | MN | FN (없으면 빈 문자열)",
    "birth": "YYYY-MM-DD (없으면 빈 문자열)",
    "owner_name": "보호자 이름 (없으면 빈 문자열)"
  },
  "sections": [
    {
      "title_vet": "증상 및 내원 경위",
      "body_vet": "▶ 주호소\n• [증상1]\n• [증상2]\n\n▶ 발현 시점 및 경과\n[내용]\n\n▶ 관련 병력\n• [병력]",
      "title_owner": "증상 및 내원 경위",
      "body_owner": "🐾 어떤 증상으로 오셨나요?\n[공감 어조로 증상 설명]\n\n📅 언제부터였나요?\n[시간 경과 설명]"
    },
    {
      "title_vet": "신체검사 및 진단 과정",
      "body_vet": "▶ 신체검사 소견\n• [소견1]\n• [소견2]\n\n▶ 추가 검사\n• [검사명]: [결과 및 의의]\n\n▶ 감별진단\n• [진단1] → [채택/배제 근거]",
      "title_owner": "검사와 진단",
      "body_owner": "🔍 어떤 검사를 했나요?\n[검사 설명]\n\n📋 검사 결과는?\n[결과 의미를 쉽게 설명]"
    },
    {
      "title_vet": "치료",
      "body_vet": "▶ 약물 치료\n• [약물명] [용량] [투여경로] [기간]\n\n▶ 처치\n• [처치내용]\n\n▶ 치료 선택 근거\n[내용]",
      "title_owner": "치료 방법",
      "body_owner": "💊 어떤 치료를 받았나요?\n[치료 설명]\n\n✅ 치료 목표\n[목표 설명]\n\n⚠️ 주의사항\n• [주의사항]"
    },
    {
      "title_vet": "경과 및 퇴원",
      "body_vet": "▶ 치료 반응\n[내용]\n\n▶ 퇴원 시 상태\n[내용]\n\n▶ 추적 관찰 계획\n• [계획]",
      "title_owner": "경과와 퇴원",
      "body_owner": "😊 치료 후 어떻게 됐나요?\n[경과 설명]\n\n🏠 집에서 주의할 점\n• [주의사항1]\n• [주의사항2]\n\n📅 다음 내원\n[일정]"
    },
    {
      "title_vet": "질병 안내",
      "body_vet": "▶ 병태생리\n[내용]\n\n▶ 예후\n[내용]\n\n▶ 재발 가능성 및 모니터링\n• [항목]",
      "title_owner": "이 질병에 대하여",
      "body_owner": "📌 이 질병이란?\n[쉬운 설명]\n\n⚠️ 재발 징후 (이런 증상이 보이면 바로 내원하세요)\n• [징후1]\n• [징후2]\n\n💡 집에서 관리하는 법\n• [관리법]"
    }
  ],
  "lab_sessions": [
    {
      "date": "2025-03-01",
      "label": "입원 1일차",
      "items": [
        { "nameEn": "ALT", "value": "120", "unit": "U/L", "ref_range": "10-100", "is_abnormal": true }
      ]
    },
    {
      "date": "2025-03-05",
      "label": "퇴원 전",
      "items": [
        { "nameEn": "ALT", "value": "45", "unit": "U/L", "ref_range": "10-100", "is_abnormal": false }
      ]
    }
  ]
}

Rules:
- All text must be in Korean
- sections: always include all 5 sections. If information is not in the document, write a placeholder like "기록 없음"
- body formatting:
  - body_vet: use "▶ 소제목" for sub-headings, "• " bullet points for lists, blank line between sub-sections
  - body_owner: use text-based emojis (🐾 📅 🔍 📋 💊 ✅ ⚠️ 😊 🏠 📌 💡 📎 🩺 etc.) for sub-headings, "• " bullet points for lists, warm and empathetic tone, avoid medical jargon
  - both: use \\n for line breaks (will be rendered as newline). Write enough detail — aim for 150–300 characters per sub-section
- ACCURACY (critical):
  - Only state what is directly documented in the provided PDF. Do not infer or assume beyond the record.
  - If a fact is uncertain, ambiguous, or not explicitly documented, prefix it with [불확실] (e.g. "[불확실] 완치 가능성이 높음")
  - Do not fabricate drug dosages, treatment protocols, or diagnostic findings not present in the document
- lab_sessions: group lab results by examination date. If only one date exists, return a single session. If date is unknown, use empty string for date. Use standard English abbreviations for nameEn (ALT, BUN, Creatinine, HCT, etc.). label must be a clinical description (e.g. "입원 1일차", "치료 3일째", "퇴원 전") — do NOT use equipment or analyzer names (e.g. do not write "Catalyst", "IDEXX", "ProCyte" etc.)
- patient: extract patient information from the header or patient info section. gender: M = 수컷, F = 암컷, MN = 중성화 수컷, FN = 중성화 암컷
- is_abnormal: true if value is outside reference range, false if normal, null if unknown
- Do NOT include markdown, only valid JSON`

// ── JSON 파싱 헬퍼 ─────────────────────────────────────────────

function extractJson<T>(text: string): T {
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const start = stripped.indexOf('{')
  if (start === -1) throw new Error('No JSON found')
  let depth = 0, inString = false, escaped = false
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
  throw new Error('Malformed JSON')
}

// ── PDF 업로드 + storage path 반환 ────────────────────────────

export async function uploadBlogPdfToStorage(
  hosId: string,
  postId: string,
  base64: string,
): Promise<string> {
  const supabase = createAdminClient()
  const fileName = `${Date.now()}.pdf`
  const filePath = `${hosId}/${postId}/${fileName}`
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(filePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (error) throw new Error(error.message)
  return filePath
}

// ── PDF 추출 메인 액션 ─────────────────────────────────────────

export async function extractBlogFromPdf(
  hosId: string,
  postId: string,
  base64: string,
  species?: string,
  extraNotes?: string,
): Promise<{ data: BlogPdfExtractionResult | null; error: string | null }> {
  try {
    const client = getAnthropicClient()

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 32000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '[수의 진료 기록 PDF]' },
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            {
              type: 'text',
              text: extraNotes?.trim()
                ? `${EXTRACTION_PROMPT}\n\nAdditional instruction: After the standard 5 sections, add one more section to the sections array that covers the following topic in depth: "${extraNotes.trim()}". Both title_vet/body_vet and title_owner/body_owner are required for this extra section as well.\n\nCRITICAL accuracy rules for this extra section — this topic likely involves medications, surgical techniques, treatment protocols, or prognosis where errors can cause harm:\n• Only include information that is (a) directly documented in the PDF, or (b) well-established in peer-reviewed veterinary medicine (WSAVA, ACVIM, ECVIM guidelines or equivalent).\n• Clearly distinguish between what the PDF states vs. general veterinary knowledge. Use prefixes: [이 케이스] for PDF-derived facts, [일반적으로] for established evidence-based knowledge.\n• If the evidence is limited, conflicting, or evolving (e.g., newer drugs, rare conditions), explicitly write [근거 제한적] and briefly state why.\n• Do NOT extrapolate survival rates, recurrence rates, or drug efficacies beyond what is documented or well-established.\n• For drug dosages mentioned: only state what is in the PDF. Do not suggest alternative dosages.\n• If you are uncertain about any claim, prefix it with [불확실] — never omit uncertainty to appear more helpful.`
                : EXTRACTION_PROMPT,
            },
          ] as any,
        },
      ],
    })

    const response = await stream.finalMessage()
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: {
      diagnosis: string
      summary: string
      species: string
      patient?: ExtractedPatient
      sections: BlogExtractedSection[]
      lab_sessions: { date: string; label?: string; items: RawLabItem[] }[]
    }
    try {
      parsed = extractJson(text)
    } catch {
      return { data: null, error: 'AI 응답 파싱 오류. 다시 시도해주세요.' }
    }

    const inferredSpecies = parsed.species || species || ''
    const unmatched: BlogPdfExtractionResult['unmatched_lab'] = []

    // 세션별로 lab items 매핑
    const mappedSessions: BlogLabSession[] = (parsed.lab_sessions ?? []).map((session) => {
      const matchedIds = new Set<string>()
      const items: LabResultItem[] = []

      for (const raw of session.items ?? []) {
        const ref = findLabRefByKeyword(raw.nameEn)
        if (ref) {
          if (matchedIds.has(ref.id)) continue
          matchedIds.add(ref.id)
          const evaled = raw.value
            ? evaluateLabValue(raw.value, ref, inferredSpecies, 'ai', raw.ref_range || null)
            : null
          items.push({
            id: ref.id,
            nameEn: ref.nameEn,
            nameKo: ref.nameKo,
            unit: raw.unit || ref.unit,
            value: raw.value || null,
            ref_range: raw.ref_range || null,
            is_abnormal: evaled ? evaled.isAbnormal : (raw.is_abnormal ?? null),
            result_text: evaled?.resultTextKo ?? null,
            severity: evaled?.severity ?? null,
            comment: null,
            source: 'ai' as const,
            section: ref.section,
            descriptionKo: ref.descriptionKo,
          })
        } else {
          unmatched.push(raw)
        }
      }

      return { date: session.date ?? '', label: session.label, items }
    })

    // ── 환자 찾기 / 신규등록 / 연결 ───────────────────────────
    let linkedPatient: (BlogPatient & { is_new: boolean }) | null = null
    const rawPatient = parsed.patient
    if (rawPatient?.hos_patient_id) {
      try {
        const supabase = await createClient()

        // 기존 환자 조회
        const { data: existing } = await supabase
          .from('patients')
          .select('patient_id, name, species, breed, gender, birth, hos_patient_id, is_alive, owner_name')
          .eq('hos_id', hosId)
          .eq('hos_patient_id', rawPatient.hos_patient_id)
          .maybeSingle()

        let patientId: string
        let isNew = false

        if (existing) {
          patientId = existing.patient_id
        } else {
          // 신규 등록
          const { data: newId, error: rpcError } = await supabase.rpc('register_patient', {
            hos_id_input: hosId,
            hos_patient_id_input: rawPatient.hos_patient_id,
            name_input: rawPatient.name || '',
            species_input: rawPatient.species || '',
            breed_input: rawPatient.breed || '',
            gender_input: rawPatient.gender || '',
            birth_input: rawPatient.birth || '',
            owner_name_input: rawPatient.owner_name || '',
            body_weight_input: '',
            memo_input: '',
            microchip_no_input: '',
            hos_owner_id_input: '',
          })
          if (rpcError) throw new Error(rpcError.message)
          patientId = newId as string
          isNew = true
        }

        // blog_posts에 patient_id 연결
        await supabase
          .from('blog_posts')
          .update({ patient_id: patientId })
          .eq('id', postId)
          .eq('hos_id', hosId)

        // 최신 환자 정보 fetch (신규인 경우 existing이 없으므로)
        const { data: fetched } = await supabase
          .from('patients')
          .select('patient_id, name, species, breed, gender, birth, hos_patient_id, is_alive, owner_name')
          .eq('patient_id', patientId)
          .single()

        if (fetched) {
          linkedPatient = {
            patient_id: fetched.patient_id,
            name: fetched.name,
            species: fetched.species,
            breed: fetched.breed,
            gender: fetched.gender,
            birth: fetched.birth,
            hos_patient_id: fetched.hos_patient_id,
            is_alive: fetched.is_alive,
            owner_name: fetched.owner_name,
            is_new: isNew,
          }
        }
      } catch {
        // 환자 연결 실패는 분석 결과에 영향 주지 않음
      }
    }

    return {
      data: {
        diagnosis: parsed.diagnosis ?? '',
        summary: parsed.summary ?? '',
        species: parsed.species ?? '',
        sections: parsed.sections ?? [],
        lab_sessions: mappedSessions,
        unmatched_lab: unmatched,
        patient: linkedPatient,
      },
      error: null,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('credit balance') || msg.includes('insufficient_quota')) {
      return { data: null, error: 'Anthropic API 크레딧이 부족합니다.' }
    }
    return { data: null, error: `분석 오류: ${msg}` }
  }
}

// ── 혈액검사 데이터 저장 ──────────────────────────────────────

export async function saveBlogLabData(
  hosId: string,
  postId: string,
  labSessions: BlogLabSession[],
  pdfUrl?: string,
): Promise<void> {
  const supabase = await createClient()
  const patch: Record<string, unknown> = { blood_test_data: labSessions as any }
  if (pdfUrl) patch.pdf_url = pdfUrl

  const { error } = await supabase
    .from('blog_posts')
    .update(patch)
    .eq('id', postId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog/${postId}`)
}

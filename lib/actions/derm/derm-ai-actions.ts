'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import type { DermAiAnalysis } from '@/types/hospital/derm-type'

interface PatientInfo {
  name?: string | null
  species?: string | null
  breed?: string | null
  gender?: string | null
  birth?: string | null
}

function buildPatientBlock(patient?: PatientInfo | null): string {
  if (!patient) return ''
  const lines: string[] = []
  if (patient.name)    lines.push(`- Patient name: ${patient.name}`)
  if (patient.species) lines.push(`- Species: ${patient.species === 'cat' ? 'Cat (Feline)' : 'Dog (Canine)'}`)
  if (patient.breed)   lines.push(`- Breed: ${patient.breed}`)
  if (patient.gender)  lines.push(`- Gender: ${patient.gender}`)
  if (patient.birth) {
    const today = new Date()
    const b = new Date(patient.birth)
    const years = today.getFullYear() - b.getFullYear()
    const months = today.getMonth() - b.getMonth()
    const age = years === 0
      ? `${Math.max(0, months + (months < 0 ? 12 : 0))} months`
      : `${years} years`
    lines.push(`- Age: ${age}`)
  }
  if (lines.length === 0) return ''
  return `\n\nPatient information:\n${lines.join('\n')}`
}

// ── 구어체 → 정식 피부과 용어 변환 ───────────────────────────

export async function convertToFormalFindings(
  rawInput: string,
  patient?: PatientInfo | null,
): Promise<{ formalFindings: string; suggestedLesionTypes: string[] }> {
  if (!rawInput.trim()) return { formalFindings: '', suggestedLesionTypes: [] }

  const client = getAnthropicClient()
  const patientBlock = buildPatientBlock(patient)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are an expert veterinary dermatologist. Respond exclusively in valid JSON — no prose, no markdown fences.',
      messages: [{
        role: 'user',
        content: `Convert the following colloquial clinical observation to formal veterinary dermatology terminology in Korean.${patientBlock}

Input: "${rawInput}"

Return JSON only:
{
  "formal_findings": "formal Korean dermatology description (1-3 sentences)",
  "lesion_types": ["one or more from: macule, papule, plaque, pustule, vesicle, nodule, tumor, erythema, alopecia, scale, crust, erosion, ulcer, lichenification, hyperpigmentation, hypopigmentation, comedone, excoriation, fistula, wheal"]
}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      formalFindings: parsed.formal_findings ?? rawInput,
      suggestedLesionTypes: Array.isArray(parsed.lesion_types) ? parsed.lesion_types : [],
    }
  } catch {
    return { formalFindings: rawInput, suggestedLesionTypes: [] }
  }
}

// ── 병변 그룹 AI 전체 분석 ────────────────────────────────────

export async function analyzeLesionGroup(
  images: Array<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }>,
  rawInput: string,
  patient?: PatientInfo | null,
): Promise<DermAiAnalysis> {
  const client = getAnthropicClient()
  const patientBlock = buildPatientBlock(patient)
  const capped = images.slice(0, 20)

  const imageBlocks = capped.map((img) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
  }))

  const countNote = capped.length > 1
    ? `You are given ${capped.length} images of the same lesion site. Integrate findings across all images.\n\n`
    : ''

  const clinicianNote = rawInput?.trim()
    ? `\nClinician's observation: "${rawInput.trim()}"\n`
    : ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are an expert veterinary dermatologist. Respond exclusively in valid JSON — no prose, no markdown fences.',
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text: `${countNote}Analyze this veterinary dermatology lesion.${patientBlock}${clinicianNote}

Return JSON matching this exact schema:
{
  "lesion_type": ["array of: macule, papule, plaque, pustule, vesicle, nodule, tumor, erythema, alopecia, scale, crust, erosion, ulcer, lichenification, hyperpigmentation, hypopigmentation, comedone, excoriation, fistula, wheal"],
  "anatomical_location": "location in Korean (e.g. 좌측 액와부)",
  "description": "formal Korean description 2-3 sentences",
  "confidence": 0.0-1.0,
  "severity": 1-4,
  "differential": ["Korean diagnosis names, most likely first, max 4"],
  "recommended_tests": ["Korean test names, max 4"],
  "immediate_action": "brief Korean action recommendation"
}`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned) as DermAiAnalysis
    return parsed
  } catch {
    return {
      lesion_type: [],
      anatomical_location: '',
      description: 'AI 분석 실패 — 수동 입력 필요',
      confidence: 0,
      severity: 1,
      differential: [],
      recommended_tests: [],
      immediate_action: '',
    }
  }
}

// ── 재진: 이전 방문과 비교 분석 ──────────────────────────────

export async function compareVisits(params: {
  prevImages: Array<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }>
  currImages: Array<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }>
  prevDate: string
  currDate: string
  prevFindings: string
  patient?: PatientInfo | null
}): Promise<{ improvement: string; notes: string }> {
  const client = getAnthropicClient()
  const patientBlock = buildPatientBlock(params.patient)

  const prevBlocks = params.prevImages.slice(0, 5).map((img) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
  }))
  const currBlocks = params.currImages.slice(0, 5).map((img) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
  }))

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are an expert veterinary dermatologist. Respond exclusively in valid JSON — no prose, no markdown fences.',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Previous visit images (${params.prevDate}):` },
          ...prevBlocks,
          { type: 'text', text: `Current visit images (${params.currDate}):` },
          ...currBlocks,
          {
            type: 'text',
            text: `Compare the lesion between the two visits.${patientBlock}
Previous findings: "${params.prevFindings}"

Return JSON:
{
  "improvement": "one of: worsened, unchanged, mild_improvement, improved, resolved",
  "notes": "brief Korean comparison 1-2 sentences"
}`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      improvement: parsed.improvement ?? 'unchanged',
      notes: parsed.notes ?? '',
    }
  } catch {
    return { improvement: 'unchanged', notes: 'AI 비교 분석 실패' }
  }
}

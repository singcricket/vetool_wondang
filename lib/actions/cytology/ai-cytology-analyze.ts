'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import type { CytologySampleType } from '@/constants/hospital/cytology/cytology-types'
import { cytologyRoutineMap } from '@/constants/hospital/cytology/cytology-routine'

function toUserFriendlyError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('credit balance') || msg.includes('insufficient_quota')) {
    throw new Error('Anthropic API 크레딧이 부족합니다. Plans & Billing에서 충전 후 다시 시도해주세요.')
  }
  if (msg.includes('invalid_api_key') || msg.includes('authentication')) {
    throw new Error('Anthropic API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.')
  }
  throw new Error('AI 판독 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
}

const SAMPLE_TYPE_LABELS: Record<CytologySampleType, string> = {
  otic: '귀도말 (Otic Swab)',
  skin_impression: '피부 인상도말 (Skin Impression Smear)',
  skin_exudate: '피부 삼출물 도말 (Skin Exudate Smear)',
  fecal: '분변염색 (Fecal Cytology)',
  vaginal: '질 세포진 (Vaginal Cytology)',
  conjunctival: '결막/각막 도말 (Conjunctival/Corneal Scraping)',
  fna_skin: 'FNA - 피부/피하 (FNA Skin/Subcutis)',
  fna_lymph: 'FNA - 림프절 (FNA Lymph Node)',
  fna_organ: 'FNA - 내부 장기 (FNA Internal Organ)',
  effusion: '체강액 (Effusion)',
  synovial: '관절액 (Synovial Fluid)',
  csf: '뇌척수액 (CSF)',
  bal: '기관지폐포세척액 (BAL)',
}

const SYSTEM_PROMPT = `You are an expert veterinary clinical cytologist assistant.
Analyze the cytology image provided and return findings in structured JSON format only.
Respond exclusively in valid JSON — no prose, no markdown fences.
Be specific about cell types, microorganisms, and abundance using veterinary cytology terminology.
Use semi-quantitative grading: none, rare (1-2/HPF), few (3-5/HPF), moderate (6-20/HPF), many (>20/HPF).`

function buildClinicalBlock(clinicalInfo?: string): string {
  if (!clinicalInfo?.trim()) return ''
  return `\nClinical context provided by the clinician:\n${clinicalInfo.trim()}\n`
}

function buildUserPrompt(sampleType: CytologySampleType, stain: string, clinicalInfo?: string): string {
  const clinicalBlock = buildClinicalBlock(clinicalInfo)
  return `Analyze this ${SAMPLE_TYPE_LABELS[sampleType]} cytology image (stain: ${stain}).${clinicalBlock}

Return a JSON object with these fields based on what you observe:
{
  "quality": "adequate|poor|hemodiluted",
  "cellularity": "low|moderate|high",
  "findings": {
    // Include ONLY fields relevant to the sample type and what is visible
    // For otic: "malassezia": "none|rare|few|moderate|many", "cocci": "...", "rods": "...", "neutrophils": "none|present|many", "mites": "absent|present"
    // For skin: "malassezia": "...", "cocci": "...", "rods": "...", "neutrophils": "...", "eosinophils": "...", "acantholytic_cells": "absent|present"
    // For fecal: "bacteria_density": "normal|overgrowth", "spiral_bacteria": "absent|present", "clostridium_spores": "absent|present", "parasites": []
    // For vaginal: "dominant_cell_type": "parabasal|intermediate|superficial|cornified", "neutrophils": "...", "bacteria": "...", "rbc": "absent|present"
    // For conjunctival: "bacteria": "none|cocci|rods|mixed", "neutrophils": "...", "eosinophils": "...", "inclusion_bodies": "absent|present"
    // For FNA/specialist: "predominant_cell_type": "epithelial|mesenchymal|round_cell|inflammatory|mixed", "cellularity": "...", "malignancy_criteria_count": 0-5, ...
  },
  "interpretation": "Brief 1-2 sentence clinical interpretation in Korean",
  "confidence": 0-100,
  "key_findings": ["list", "of", "key", "observations"]
}`
}

interface AIAnalysisResult {
  quality: string
  cellularity: string
  findings: Record<string, string | string[]>
  interpretation: string
  confidence: number
  key_findings: string[]
}

export async function analyzeCytologyImage(
  images: Array<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }>,
  sampleType: CytologySampleType,
  stain: string = 'Diff-Quik',
  clinicalInfo?: string,
): Promise<AIAnalysisResult> {
  const client = getAnthropicClient()

  const imageBlocks = images.map((img) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.mediaType,
      data: img.base64,
    },
  }))

  const countNote =
    images.length > 1
      ? `You are given ${images.length} images of the same sample site. Integrate findings across all images.`
      : ''

  let response
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: countNote
                ? `${countNote}\n\n${buildUserPrompt(sampleType, stain, clinicalInfo)}`
                : buildUserPrompt(sampleType, stain, clinicalInfo),
            },
          ],
        },
      ],
    })
  } catch (err) {
    toUserFriendlyError(err)
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned) as AIAnalysisResult
  } catch {
    return {
      quality: 'adequate',
      cellularity: 'moderate',
      findings: {},
      interpretation: text.slice(0, 200),
      confidence: 30,
      key_findings: ['AI 응답 파싱 오류 — 수동 입력 필요'],
    }
  }
}

// ── Form-field-aware auto-fill ────────────────────────────────
// Returns findings keyed by exact form testIds so they can be
// applied directly to the specialist / routine form state.

interface FormFillResult {
  findings: Record<string, string | string[]>
  summary: string
}

const SPECIALIST_SCHEMA = `{
  "sq_cellularity": "low|moderate|high",
  "sq_hemodilution": "none|mild|moderate|severe",
  "sq_necrosis": "none|present",
  "infl_type": "neutrophilic_pure|neutrophilic_septic|macrophagic|eosinophilic|lymphocytic|mixed|none",
  "infl_degenerate_neutrophils": "false|true",
  "infl_giant_cells": "false|true",
  "infl_plasma_cells": "false|true",
  "identified_cells": ["one or more of: epi_squamous, epi_glandular, epi_transitional, epi_hepatocyte, epi_sebaceous, mes_spindle, mes_adipocyte, mes_chondrocyte, rc_mast_cell, rc_lymphocyte, rc_plasma_cell, rc_histiocyte, rc_tvt — use [] if no dominant neoplastic/round cell type"],
  "sq_cell_arrangement": "cohesive|loosely_cohesive|discohesive",
  "gl_arrangement": "acinar|papillary|solid|single_cells",
  "sp_cell_shape": "spindle|stellate|pleomorphic",
  "mast_granules": "abundant|reduced|absent",
  "mast_nuclear_atypia": "none|mild|moderate|severe",
  "lym_cell_size": "small|medium|large",
  "lym_blast_proportion": "none|occasional|increased|dominant",
  "lym_population_uniformity": "polymorphic|monomorphic",
  "malig_criteria_1": "false|true",
  "malig_criteria_2": "false|true",
  "malig_criteria_3": "false|true",
  "malig_criteria_4": "false|true",
  "malig_criteria_5": "false|true",
  "summary": "1-2 sentence Korean cytological interpretation"
}`

function buildRoutineSchema(sampleType: CytologySampleType): string {
  const def = cytologyRoutineMap[sampleType]
  if (!def) return '{}'

  const lines: string[] = []
  for (const section of def.sections) {
    lines.push(`  // ${section.label}`)
    for (const test of section.tests) {
      if (test.testType === 'semiquant') {
        lines.push(`  "${test.testId}": "none|rare|few|moderate|many",  // ${test.label}`)
      } else if (test.testType === 'boolean') {
        const vals = test.options
          ? test.options.map((o) => `"${o.value}"`).join('|')
          : '"absent"|"present"'
        lines.push(`  "${test.testId}": ${vals},  // ${test.label}`)
      } else if (test.testType === 'select' && test.options) {
        const vals = test.options.map((o) => `"${o.value}"`).join('|')
        lines.push(`  "${test.testId}": ${vals},  // ${test.label}`)
      }
      // skip text/multiselect — AI can't reliably fill free text
    }
  }
  lines.push('  "summary": "1-2 sentence Korean cytological interpretation"')
  return `{\n${lines.join('\n')}\n}`
}

function buildFormFillPrompt(sampleType: CytologySampleType, stain: string): string {
  const isRoutine = sampleType in cytologyRoutineMap
  const schema = isRoutine ? buildRoutineSchema(sampleType) : SPECIALIST_SCHEMA

  return `You are an expert veterinary clinical cytologist.
Analyze this ${SAMPLE_TYPE_LABELS[sampleType]} cytology image (stain: ${stain}).

Return ONLY valid JSON using EXACTLY the field names and allowed values below.
Omit any field you cannot clearly assess. Use normal/absent/none for negative findings.

${schema}`
}

export async function analyzeToFormFields(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  sampleType: CytologySampleType,
  stain: string = 'Diff-Quik',
): Promise<FormFillResult> {
  const client = getAnthropicClient()

  let response
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: 'You are an expert veterinary cytologist. Respond exclusively in valid JSON — no prose, no markdown fences.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: buildFormFillPrompt(sampleType, stain) },
          ],
        },
      ],
    })
  } catch (err) {
    toUserFriendlyError(err)
  }

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    const { summary, ...rest } = parsed
    const findings: Record<string, string | string[]> = {}

    for (const [k, v] of Object.entries(rest)) {
      if (Array.isArray(v)) {
        findings[k] = v.map(String)
      } else if (v !== null && v !== undefined) {
        findings[k] = String(v)
      }
    }

    return { findings, summary: typeof summary === 'string' ? summary : '' }
  } catch {
    return { findings: {}, summary: 'AI 응답 파싱 오류 — 수동 입력 필요' }
  }
}

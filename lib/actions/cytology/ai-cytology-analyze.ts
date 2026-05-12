'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import type { CytologySampleType } from '@/constants/hospital/cytology/cytology-types'

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

function buildUserPrompt(sampleType: CytologySampleType, stain: string): string {
  return `Analyze this ${SAMPLE_TYPE_LABELS[sampleType]} cytology image (stain: ${stain}).

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
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  sampleType: CytologySampleType,
  stain: string = 'Diff-Quik',
): Promise<AIAnalysisResult> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: buildUserPrompt(sampleType, stain),
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    // Strip any accidental markdown fences
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

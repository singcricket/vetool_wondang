'use server'

import Anthropic from '@anthropic-ai/sdk'
import { logAiUsage } from '@/lib/ai/log-usage'

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY 미설정')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export type ExtractedPatientData = {
  name: string | null
  hos_patient_id: string | null
  species: 'canine' | 'feline' | null
  breed_raw: string | null      // 한국어 품종명 그대로
  gender: 'cm' | 'sf' | 'im' | 'if' | 'un' | null
  birth: string | null          // YYYY-MM-DD
  microchip_no: string | null
  weight: string | null         // 숫자만, 단위 제외
  owner_name: string | null
  hos_owner_id: string | null
  memo: string | null
}

async function extractTextWithGoogleVision(base64Image: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY 미설정')

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        }],
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Vision API 오류 (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.responses?.[0]?.fullTextAnnotation?.text ?? ''
}

export async function extractPatientFromImage(
  base64Image: string,
  hosId?: string,
): Promise<ExtractedPatientData> {
  const rawText = await extractTextWithGoogleVision(base64Image)
  if (!rawText.trim()) throw new Error('이미지에서 텍스트를 인식할 수 없습니다.')

  const client = getAnthropicClient()

  const prompt = `아래는 동물병원 EMR 환자 정보 화면을 촬영한 사진의 OCR 텍스트입니다.
이 텍스트에서 환자(동물) 정보를 추출하여 JSON 객체 하나만 반환하세요.

OCR 텍스트:
${rawText}

추출 규칙:
- name: 동물(환자)의 이름 (보호자 이름과 혼동 주의)
- hos_patient_id: 차트번호, 환자번호, 등록번호 등 숫자 ID
- species: 개는 "canine", 고양이는 "feline", 그 외 또는 불분명하면 null
- breed_raw: 품종명을 한국어 그대로 (예: "말티즈", "포메라니안", "코리안숏헤어", "믹스견")
- gender: 중성화수컷="cm", 중성화암컷="sf", 수컷(intact)="im", 암컷(intact)="if", 모름="un"
  (중성화: 수술함/neutered/castrated/spayed 의미, 미중성화: intact)
- birth: 생년월일 YYYY-MM-DD (연도만 있으면 YYYY-01-01, 연월만 있으면 YYYY-MM-01)
- microchip_no: 마이크로칩 번호
- weight: 체중 숫자만 문자열로 (예: "3.5"), 단위(kg) 제외
- owner_name: 보호자/보호자명
- hos_owner_id: 보호자 번호 또는 ID
- memo: 알레르기, 기저질환 등 기타 특이사항 (없으면 null)
- 확인 안 되는 필드는 반드시 null

JSON만 반환 (설명, 마크다운 없이):
{"name":null,"hos_patient_id":null,"species":null,"breed_raw":null,"gender":null,"birth":null,"microchip_no":null,"weight":null,"owner_name":null,"hos_owner_id":null,"memo":null}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  if (hosId) {
    logAiUsage({
      hosId,
      feature: 'patient_ocr',
      model: 'claude-haiku-4-5-20251001',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    })
  }

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI 응답 파싱 실패')

  return JSON.parse(clean.slice(start, end + 1)) as ExtractedPatientData
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { logAiUsage } from '@/lib/ai/log-usage'
import { ECHO_TESTS_CANINE } from '@/constants/hospital/echocardio/echo-tests-canine'
import { ECHO_TESTS_FELINE } from '@/constants/hospital/echocardio/echo-tests-feline'
import type { Species } from '@/types/echocardio/echocardio-type'
import { revalidatePath } from 'next/cache'

export type MatchedField = {
  keyword_id: string
  keyword_name: string
  unit: string
  raw_text: string
  value: string
  confidence: number
  applied: boolean
  source: 'ocr' | 'vision'  // OCR 수치 vs Claude 이미지 직접 분석
}

export type EchoScanImage = {
  id: string
  echo_id: string
  hos_id: string
  file_path: string
  file_name: string
  public_url: string
  mode_label: string | null
  ocr_raw_text: string | null
  matched_fields: MatchedField[]
  ai_model: string | null
  created_at: string
  updated_at: string
}

// ── Google Vision OCR ───────────────────────────────────────────

async function extractTextWithGoogleVision(base64Image: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY 환경변수가 설정되지 않았습니다.')

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: base64Image }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
      }),
    },
  )

  if (!res.ok) throw new Error(`Google Vision API 오류 (${res.status})`)
  const json = await res.json()
  return json.responses?.[0]?.fullTextAnnotation?.text ?? ''
}

// ── Claude Haiku: OCR 텍스트 → 수치 필드 매칭 ──────────────────

async function matchNumericFieldsFromOcr(
  ocrText: string,
  species: Species,
  hosId: string,
): Promise<MatchedField[]> {
  const client = getAnthropicClient()
  const tests = species === 'feline' ? ECHO_TESTS_FELINE : ECHO_TESTS_CANINE

  const fieldList = Object.values(tests)
    .filter((t) => t.testType === 'other' || t.testType === 'range' || t.testType === 'mmode_range' || t.testType === 'mmode_formula')
    .map((t) => ({ keyword_id: t.keywordID, keyword_name: t.keywordName, unit: (t as any).unit ?? '' }))

  const prompt = `아래는 심장초음파 검사지에서 OCR로 추출한 텍스트입니다.
이 텍스트에서 심장초음파 검사 수치를 추출하여 제공된 검사 항목 목록과 매칭해주세요.

<ocr_text>
${ocrText}
</ocr_text>

매칭 가능한 수치 항목 (${fieldList.length}개):
${JSON.stringify(fieldList)}

규칙:
- 텍스트에서 수치값이 명확히 보이는 항목만 매칭
- keyword_id는 반드시 제공된 목록에서 선택
- raw_text: OCR에서 해당 수치가 있는 원본 행
- value: 숫자값 문자열
- confidence: 0.0~1.0 (0.7 미만은 제외)

반환 형식 (JSON 배열만):
[{"keyword_id":"LVd","keyword_name":"LV-d(LVIDd)","unit":"mm","raw_text":"LVd 38.2","value":"38.2","confidence":0.95}]

JSON만 반환하세요.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  logAiUsage({ hosId, feature: 'echo_scan_ocr_match', model: 'claude-haiku-4-5-20251001', inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('[')
  const end = clean.lastIndexOf(']')
  if (start === -1 || end === -1) return []

  const parsed: Omit<MatchedField, 'applied' | 'source'>[] = JSON.parse(clean.slice(start, end + 1))
  return parsed.map((f) => ({ ...f, applied: false, source: 'ocr' as const }))
}

// ── Claude Sonnet Vision: 이미지 직접 분석 → select 필드 소견 ──

// 이미지 직접 분석 대상 select 필드 (공통 - canine/feline 동일)
const VISION_SELECT_FIELDS = [
  // B-mode 승모판
  { keyword_id: 'MV_leafletTipThickening', keyword_name: 'MV Leaflet Tip Thickening', options: ['none', 'anterior', 'posterior', 'anterior & posterior'], hint: 'Mitral valve leaflet tip thickening visible on B-mode' },
  { keyword_id: 'MV_prolapse',             keyword_name: 'MV Prolapse',                options: ['none', 'anterior', 'posterior', 'anterior & posterior'], hint: 'Mitral valve leaflet prolapse beyond mitral annular plane into left atrium on B-mode' },
  { keyword_id: 'MV_flailmovement',        keyword_name: 'MV Flail Movement',          options: ['none', 'anterior', 'posterior', 'anterior & posterior'], hint: 'Flail mitral leaflet with ruptured chordae tendineae on B-mode' },
  { keyword_id: 'MV_SAM',                  keyword_name: 'Systolic Anterior Motion (SAM)', options: ['none', 'yes'], hint: 'Systolic anterior motion of mitral valve toward IVS on B-mode or M-mode' },
  // B-mode 삼첨판
  { keyword_id: 'TV_leafletTipThickening', keyword_name: 'TV Leaflet Tip Thickening',  options: ['none', 'yes'], hint: 'Tricuspid valve leaflet tip thickening on B-mode' },
  { keyword_id: 'TV_prolapse',             keyword_name: 'TV Prolapse',                options: ['none', 'yes'], hint: 'Tricuspid valve leaflet prolapse beyond tricuspid annular plane on B-mode' },
  { keyword_id: 'TV_flailmovement',        keyword_name: 'TV Flail Movement',          options: ['none', 'yes'], hint: 'Flail tricuspid leaflet on B-mode' },
  // B-mode 대동맥판/폐동맥판
  { keyword_id: 'AV_flattening',           keyword_name: 'Aortic Valve Flattening',    options: ['none', 'yes'], hint: 'Reduced opening amplitude (flattening) of aortic valve cusps on B-mode or M-mode' },
  { keyword_id: 'AV_poststenoticdilation', keyword_name: 'AV Post-stenotic Dilation',  options: ['none', 'yes'], hint: 'Dilation of aorta/pulmonary artery just distal to stenotic valve on B-mode' },
  { keyword_id: 'LVOT_obstruction',        keyword_name: 'LVOT Obstruction',           options: ['none', 'yes'], hint: 'Left ventricular outflow tract narrowing/obstruction visible on B-mode or Doppler' },
  { keyword_id: 'PV_thickening',           keyword_name: 'PV Thickening',              options: ['none', 'yes'], hint: 'Pulmonic valve leaflet thickening on B-mode' },
  { keyword_id: 'PV_changeOfdimension',    keyword_name: 'PV Change of Dimension',     options: ['none', 'yes'], hint: 'Abnormal change in pulmonic valve dimension on B-mode' },
  // B-mode IVS/RV
  { keyword_id: 'IVS_flattening',          keyword_name: 'IVS Flattening',             options: ['none', 'yes'], hint: 'Interventricular septum D-shaped (flattening) indicating RV pressure/volume overload on B-mode short-axis' },
  { keyword_id: 'IVS_paradoxicalMV',       keyword_name: 'IVS Paradoxical Movement',   options: ['none', 'yes'], hint: 'Paradoxical septal motion (moving toward RV in systole) on B-mode or M-mode' },
  { keyword_id: 'RVhypertrophy',           keyword_name: 'RV hypertrophy',             options: ['none', 'yes'], hint: 'Right ventricular free wall hypertrophy (>5mm) on B-mode' },
  { keyword_id: 'RVsystolicDysfunction',   keyword_name: 'RV systolic dysfunction',    options: ['none', 'yes'], hint: 'Reduced RV contractility, abnormal TAPSE or FAC on B-mode' },
  { keyword_id: 'RAenlargement',           keyword_name: 'RA enlargement',             options: ['none', 'yes'], hint: 'Right atrial enlargement on B-mode' },
  { keyword_id: 'CVCenlargement',          keyword_name: 'CVC enlargement',            options: ['none', 'yes'], hint: 'Caudal vena cava enlargement/non-collapsibility on B-mode' },
  // B-mode 삼출
  { keyword_id: 'PericardialEffusion',     keyword_name: 'Pericardial Effusion',       options: ['none', 'yes'], hint: 'Anechoic fluid between pericardium and myocardium on B-mode' },
  { keyword_id: 'PleuralEffusion',         keyword_name: 'Pleural Effusion',           options: ['none', 'yes'], hint: 'Anechoic fluid in pleural space on B-mode' },
  // Color Doppler turbulent jets
  { keyword_id: 'MV_turbulentJet',         keyword_name: 'MV Turbulent Jet',           options: ['none', 'yes'], hint: 'Mitral regurgitation turbulent color jet from LV into LA on color Doppler' },
  { keyword_id: 'TV_turbulentJet',         keyword_name: 'TV Turbulent Jet',           options: ['none', 'yes'], hint: 'Tricuspid regurgitation turbulent color jet from RV into RA on color Doppler' },
  { keyword_id: 'AV_turbulentJet',         keyword_name: 'AV Turbulent Jet',           options: ['none', 'yes'], hint: 'Aortic stenosis or AR turbulent jet on color Doppler' },
  { keyword_id: 'PV_turbulentJet',         keyword_name: 'PV Turbulent Jet',           options: ['none', 'yes'], hint: 'Pulmonic stenosis or PR turbulent jet on color Doppler' },
  // Spectral Doppler 역류 중증도
  { keyword_id: 'MR', keyword_name: 'MV Regurgitation', options: ['none', 'mild', 'moderate', 'severe'], hint: 'Mitral regurgitation severity assessed by color Doppler jet area or CW Doppler signal density' },
  { keyword_id: 'TR', keyword_name: 'TR Regurgitation', options: ['none', 'mild', 'moderate', 'severe'], hint: 'Tricuspid regurgitation severity assessed by color Doppler' },
  { keyword_id: 'PR', keyword_name: 'PA Regurgitation', options: ['none', 'mild', 'moderate', 'severe'], hint: 'Pulmonic regurgitation severity assessed by color Doppler' },
  { keyword_id: 'AR', keyword_name: 'AR Regurgitation', options: ['none', 'mild', 'moderate', 'severe'], hint: 'Aortic regurgitation severity assessed by color Doppler' },
]

async function analyzeEchoImageWithVision(
  base64Image: string,
  species: Species,
  hosId: string,
): Promise<MatchedField[]> {
  const client = getAnthropicClient()

  const fieldDescriptions = VISION_SELECT_FIELDS.map((f) =>
    `- keyword_id: "${f.keyword_id}" | ${f.keyword_name} | options: [${f.options.map((o) => `"${o}"`).join(', ')}]\n  판단 기준: ${f.hint}`,
  ).join('\n')

  const speciesLabel = species === 'feline' ? '고양이(Feline)' : '개(Canine)'

  const prompt = `당신은 수의 심장전문의입니다. 아래 심장초음파 이미지를 분석하여 각 항목에 대한 소견을 제공하세요.

대상 동물: ${speciesLabel}
이미지 유형: B-mode / Color Doppler / Spectral Doppler / M-mode 중 하나일 수 있습니다.

**분석 대상 항목:**
${fieldDescriptions}

**응답 규칙:**
1. 이 이미지에서 직접 판단 가능한 항목만 포함하세요 (다른 뷰/모드가 필요한 항목은 제외)
2. value는 반드시 해당 항목의 options 중 하나여야 합니다 (빈 문자열 "" 제외)
3. confidence: 이미지 품질 및 소견 명확도 기반 (0.7 미만은 제외)
4. raw_text: 판단 근거 (예: "승모판 전엽이 승모판 환형보다 좌심방 쪽으로 돌출됨")
5. value가 "none"인 경우는 정상 소견이므로 포함하지 마세요 (비정상 소견만 반환)

반환 형식 (JSON 배열만, 비정상 소견 또는 판단 가능한 항목만):
[{"keyword_id":"MV_prolapse","keyword_name":"MV Prolapse","unit":"","raw_text":"전엽이 승모판 환형 평면을 초과하여 좌심방 측으로 돌출","value":"anterior","confidence":0.88}]

비정상 소견이 없거나 이 이미지에서 판단 불가능한 경우: []
JSON만 반환하세요.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        { type: 'text', text: prompt },
      ],
    }],
  })

  logAiUsage({ hosId, feature: 'echo_scan_vision', model: 'claude-sonnet-4-6', inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  console.log('[echo-scan vision] Claude 결과:', text)

  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('[')
  const end = clean.lastIndexOf(']')
  if (start === -1 || end === -1) return []

  const parsed: Omit<MatchedField, 'applied' | 'source'>[] = JSON.parse(clean.slice(start, end + 1))
  return parsed.map((f) => ({ ...f, unit: f.unit ?? '', applied: false, source: 'vision' as const }))
}

// ── 이미지 업로드 + OCR + Vision 병렬 처리 → DB 저장 ───────────

export async function uploadAndProcessEchoScanImage(
  hosId: string,
  echoId: string,
  base64: string,
  fileName: string,
  species: Species,
  modeLabel?: string,
): Promise<EchoScanImage> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Storage 업로드 (admin client로 RLS 우회 — 서버액션 내부라 안전)
  const timestamp = Date.now()
  const filePath = `${hosId}/${echoId}/${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}.jpg`

  const byteString = atob(base64)
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'image/jpeg' })

  const { error: uploadError } = await adminClient.storage
    .from('echo-scan-images')
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) throw new Error(`Storage 업로드 실패: ${uploadError.message}`)

  const { data: urlData } = adminClient.storage.from('echo-scan-images').getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  // OCR + Vision 병렬 실행
  const [ocrText, visionFields] = await Promise.all([
    extractTextWithGoogleVision(base64).catch((e) => {
      console.warn('[echo-scan] Google Vision 실패:', e)
      return ''
    }),
    analyzeEchoImageWithVision(base64, species, hosId).catch((e) => {
      console.warn('[echo-scan] Claude Vision 실패:', e)
      return [] as MatchedField[]
    }),
  ])

  // OCR 텍스트 → 수치 필드 매칭
  let ocrFields: MatchedField[] = []
  if (ocrText.trim()) {
    ocrFields = await matchNumericFieldsFromOcr(ocrText, species, hosId).catch((e) => {
      console.warn('[echo-scan] OCR 매칭 실패:', e)
      return []
    })
  }

  // 결과 병합: OCR 수치 + Vision 주관적 소견 (keyword_id 중복 시 confidence 높은 것 우선)
  const mergedMap = new Map<string, MatchedField>()
  for (const f of [...ocrFields, ...visionFields]) {
    const existing = mergedMap.get(f.keyword_id)
    if (!existing || f.confidence > existing.confidence) mergedMap.set(f.keyword_id, f)
  }
  const matchedFields = Array.from(mergedMap.values())

  // DB 저장
  const { data, error } = await supabase
    .from('echo_scan_images')
    .insert({
      echo_id: echoId,
      hos_id: hosId,
      file_path: filePath,
      file_name: fileName,
      public_url: publicUrl,
      mode_label: modeLabel ?? null,
      ocr_raw_text: ocrText || null,
      matched_fields: matchedFields as any,
      ai_model: 'claude-sonnet-4-6',
    })
    .select()
    .single()

  if (error) throw new Error(`DB 저장 실패: ${error.message}`)

  return { ...(data as any), matched_fields: matchedFields } as EchoScanImage
}

// ── 이미지 목록 조회 ────────────────────────────────────────────

export async function getEchoScanImages(echoId: string): Promise<EchoScanImage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('echo_scan_images')
    .select('*')
    .eq('echo_id', echoId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []).map((row) => ({
    ...row,
    matched_fields: ((row.matched_fields as any) ?? []).map((f: any) => ({
      ...f,
      source: f.source ?? 'ocr',
    })),
  })) as EchoScanImage[]
}

// ── matched_fields 업데이트 (applied 플래그) ────────────────────

export async function updateScanImageMatchedFields(
  imageId: string,
  matchedFields: MatchedField[],
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_scan_images')
    .update({ matched_fields: matchedFields as any })
    .eq('id', imageId)
  if (error) throw new Error(error.message)
}

// ── 이미지 삭제 ─────────────────────────────────────────────────

export async function deleteEchoScanImage(imageId: string, filePath: string): Promise<void> {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await adminClient.storage.from('echo-scan-images').remove([filePath])
  const { error } = await supabase.from('echo_scan_images').delete().eq('id', imageId)
  if (error) throw new Error(error.message)
}

// ── AI 소견서 생성 → echo_charts.memo 업데이트 ──────────────────

export async function generateEchoFinding(
  hosId: string,
  echoId: string,
  echoResultMap: Record<string, string>,
  species: Species,
): Promise<string> {
  const client = getAnthropicClient()
  const tests = species === 'feline' ? ECHO_TESTS_FELINE : ECHO_TESTS_CANINE

  const entries = Object.entries(echoResultMap)
    .filter(([, v]) => v !== '')
    .map(([keywordId, value]) => {
      const test = tests[keywordId]
      return test ? `${test.keywordName}: ${value} ${(test as any).unit ?? ''}`.trim() : null
    })
    .filter(Boolean)

  if (!entries.length) throw new Error('입력된 검사값이 없습니다.')

  const speciesLabel = species === 'feline' ? '고양이(Feline)' : '개(Canine)'

  const prompt = `아래는 ${speciesLabel}의 심장초음파 검사 결과입니다.
아래 형식에 맞춰 소견서를 작성해주세요.

[검사 결과]
${entries.join('\n')}

[출력 형식 - 아래 구조와 기호를 반드시 그대로 사용]

■ 주요 소견
· (이상 소견을 항목별로 한 줄씩. 없으면 "· 특이 소견 없음")

■ 임상적 의미
· (각 이상 소견의 심장학적 의미를 항목별로 한 줄씩)

■ 병기 및 중증도
· (ACVIM stage, 역류 중증도 등. 해당 없으면 이 섹션 생략)

■ 추천 사항
· (모니터링 주기, 추가 검사, 치료 고려 사항 등 항목별)

━━━━━━━━━━━━━━━━━━━━━━
[보호자 설명 — 쉬운 용어]
━━━━━━━━━━━━━━━━━━━━━━

■ 검사 결과 요약
· (보호자가 이해할 수 있는 쉬운 말로 항목별 한 줄씩)

■ 지금 어떤 상태인가요?
(2~3문장. 의학 용어 최소화, 일상적 비유 사용 가능)

■ 앞으로 어떻게 해야 하나요?
· (보호자가 실천할 수 있는 행동 지침, 항목별)

[작성 규칙]
- 수의사용 섹션: 전문 용어, 간결하게
- 보호자용 섹션: 중학생도 이해할 수 있는 표현
- 검사값에 없는 내용은 추측하지 말 것
- 형식 기호(■ · ━)를 그대로 사용할 것
- 제목/날짜/서명 제외, 내용만 반환`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  logAiUsage({ hosId, feature: 'echo_scan_finding', model: 'claude-sonnet-4-6', inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens })

  const memo = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  const supabase = await createClient()
  await supabase.from('echo_charts').update({ memo }).eq('id', echoId)

  revalidatePath(`/hospital/${hosId}/echocardio`)
  return memo
}

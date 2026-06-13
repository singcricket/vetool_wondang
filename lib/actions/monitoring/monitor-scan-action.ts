'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import type { DeviceProfile, CalibrationExtractedItem, MonitorScanResult, MonitorScanResponse } from '@/types/monitoring/device-profile-type'
import type { VitalTimeSlot } from '@/types/monitoring/monitoring-type'
import type { VitalRefRange } from '@/types/adimin'
import { VITAL_REFERENCE_DATA } from '@/types/monitoring/monitoring-type'

const VITAL_NAMES = VITAL_REFERENCE_DATA.map((v) => v.vitalName)

// ── Google Vision OCR ────────────────────────────────────────────

async function extractTextWithGoogleVision(base64Image: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY 환경변수가 설정되지 않았습니다.')

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    },
  )
  if (!res.ok) throw new Error(`Google Vision API 오류 (${res.status})`)
  const json = await res.json()
  return json.responses?.[0]?.fullTextAnnotation?.text ?? ''
}

// ── 캘리브레이션: 이미지에서 모든 라벨+값 추출 (장비 프로파일 없이) ──

export async function calibrateMonitorImage(
  base64Image: string,
): Promise<{ data: CalibrationExtractedItem[] | null; error: string | null }> {
  try {
    const [ocrText] = await Promise.all([extractTextWithGoogleVision(base64Image)])

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
            },
            {
              type: 'text',
              text: `이것은 환자 모니터링 장비의 화면 사진입니다.

OCR 추출 텍스트:
${ocrText}

이미지와 OCR 텍스트를 함께 분석하여 화면에 표시된 모든 측정 항목과 값을 추출하세요.

규칙:
- label: 화면에 표시된 항목 라벨 (영문 그대로, 예: "HR", "SpO2", "NIBP", "EtCO2")
- value: 해당 항목의 현재 측정값 (단위 제외, 숫자만)
- 값이 불명확하거나 "--"인 항목은 제외
- 알람/경고 텍스트, 시간, 배터리 등 측정값이 아닌 항목은 제외

JSON 배열만 반환:
[{"label":"HR","value":"75"},{"label":"SpO2","value":"98"}]`,
            },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(stripped) as CalibrationExtractedItem[]
    return { data: parsed, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { data: null, error: `캘리브레이션 분석 실패: ${msg}` }
  }
}

// ── 실제 사용: 장비 프로파일 + 이미지 → 수치 추출 + 임상 해석 ──

export async function scanMonitorImage(params: {
  base64Image: string
  profile: DeviceProfile
  vitalRefRange: VitalRefRange[]
  recentSlots: VitalTimeSlot[]   // 최근 2-3 슬롯 (트렌드 감지용)
  species: 'canine' | 'feline' | null
  sessionTitle: string | null
}): Promise<{ data: MonitorScanResponse | null; error: string | null }> {
  const { base64Image, profile, vitalRefRange, recentSlots, species, sessionTitle } = params

  try {
    const ocrText = await extractTextWithGoogleVision(base64Image)

    // ── 프로파일 컨텍스트 ──────────────────────────────────────────
    const mappingContext = profile.field_mappings
      .filter((m) => m.our_vital !== null)
      .map((m) => `  "${m.device_label}" → "${m.our_vital}"${m.parse_hint ? ` (${m.parse_hint})` : ''}`)
      .join('\n')

    const ignoredLabels = profile.field_mappings
      .filter((m) => m.our_vital === null)
      .map((m) => m.device_label)
      .join(', ')

    const samplesContext =
      profile.verified_samples.length > 0
        ? `\n검증된 샘플 (참고용):\n` +
          profile.verified_samples
            .map((s, i) => `샘플 ${i + 1}: ${s.confirmed.map((c) => `${c.label}=${c.value}`).join(', ')}`)
            .join('\n')
        : ''

    // ── 정상 범위 컨텍스트 ────────────────────────────────────────
    const sp = species ?? 'canine'
    const refContext = vitalRefRange.length > 0
      ? vitalRefRange
          .map((r) => `  ${r.order_name}: ${r[sp].min}–${r[sp].max}`)
          .join('\n')
      : VITAL_REFERENCE_DATA
          .filter((v) => v.type === 'range' && (v.canine || v.feline))
          .map((v) => {
            const range = sp === 'feline' ? (v.feline ?? v.canine) : (v.canine ?? v.feline)
            return `  ${v.vitalName}: ${range!.min}–${range!.max}${v.unit ? ` ${v.unit}` : ''}`
          })
          .join('\n')

    // ── 최근 이력 컨텍스트 (트렌드용) ────────────────────────────
    const historyContext = recentSlots.length > 0
      ? `\n최근 측정 이력 (오래된 순):\n` +
        recentSlots
          .slice(-3)
          .reverse()
          .map((s) => `  [${s.minTime}] ${s.vitals.map((v) => `${v.vitalName}=${v.value}`).join(', ')}`)
          .join('\n')
      : ''

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
            },
            {
              type: 'text',
              text: `수의학 환자 모니터링 장비 화면입니다.
${sessionTitle ? `세션: ${sessionTitle}` : ''}
환자 종: ${sp === 'feline' ? '고양이(Feline)' : '개(Canine)'}
장비명: ${profile.device_name}
${profile.layout_hint ? `화면 구조 힌트: ${profile.layout_hint}` : ''}

=== 라벨 매핑 ===
${mappingContext || '(매핑 없음)'}
${ignoredLabels ? `무시할 라벨: ${ignoredLabels}` : ''}
${samplesContext}

=== OCR 추출 텍스트 ===
${ocrText}

=== 정상 참조 범위 (${sp}) ===
${refContext}
${historyContext}

=== 지시사항 ===
아래 JSON 형식으로만 반환하세요. 다른 텍스트 금지.

{
  "vitals": [
    {"vital_name":"심박수(HR)","value":"75","device_label":"HR","is_abnormal":false}
  ],
  "assessment": {
    "alerts": ["HR 45 bpm — 서맥, 정상 범위(${sp === 'feline' ? '120-200' : '80-150'}) 이탈"],
    "status": "현재 환자 상태 요약 1-2문장 (한국어)",
    "suggestions": ["구체적 대응 방법 1", "구체적 대응 방법 2"]
  }
}

vitals 규칙:
- vital_name: 매핑 테이블의 our_vital 이름, 없으면 라벨명 그대로
- parse_hint 있으면 해당 힌트대로 값 파싱
- 값이 "--", "---", 불명확한 경우 제외
- is_abnormal: 정상 범위 이탈 또는 임상적으로 주의 필요하면 true

assessment 규칙:
- alerts: 정상 범위 이탈 항목, 이전 이력 대비 급격한 변화 (없으면 빈 배열 [])
- status: 전반적인 환자 상태를 1-2문장으로 요약. 장비 이상 가능성도 언급 가능
- suggestions: 수의사/보조자가 즉시 취할 수 있는 구체적 조치. 없으면 빈 배열 []
- 모든 수치가 정상이면 assessment.alerts=[], suggestions=[], status="전반적으로 안정적인 상태입니다."

사용 가능한 항목명: ${VITAL_NAMES.join(', ')}`,
            },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(stripped) as MonitorScanResponse
    return { data: parsed, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { data: null, error: `모니터 스캔 분석 실패: ${msg}` }
  }
}

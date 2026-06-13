'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { echoCategories, echoMeasurements } from '@/constants/hospital/checkup/echo-ref'
import type { EchoCategoryId } from '@/constants/hospital/checkup/echo-ref'
import type { EchoChartResultData } from './linked-chart-actions'

// ── echo keyword_id → checkup echoMeasurement id 직접 매핑 ──────────
const ECHO_KW_TO_CHECKUP_MEAS: Record<string, string> = {
  LAAO:         'la_ao',           // LA:AO ratio (echo 차트에서 계산된 값)
  LVIDDN:       'lviddn',          // LVIDDN
  FS:           'fs_percent',      // FS%
  VSd:          'ivsd',            // IVSd
  LVWd:         'lvfwd',           // LVFWd
  TR_vel:       'vmax_tr',         // Vmax TR
  AV_velocity:  'aov_vmax',        // AoV Vmax
  EEm:          'e_e_prime_ratio', // E/e' (TDI)
}

// ── 결과 타입 ─────────────────────────────────────────────────────────
export type EchoFillResult = {
  measurements: Record<string, string>
  checked: Record<string, boolean>
  notes: Record<EchoCategoryId, string>
}

// ── 메인 서버 액션 ────────────────────────────────────────────────────
export async function fillCheckupEchoFromChart(
  echoData: EchoChartResultData,
  species: 'dog' | 'cat',
): Promise<{ data: EchoFillResult | null; error: string | null }> {
  try {
    const resultMap = Object.fromEntries(
      echoData.results.map((r) => [
        r.keyword_id,
        { value: r.value, result: r.result, comment: r.comment },
      ]),
    )

    // ── 1. 수치 직접 매핑 (AI 불필요) ─────────────────────────────────
    const measurements: Record<string, string> = {}
    for (const [echoKw, checkupId] of Object.entries(ECHO_KW_TO_CHECKUP_MEAS)) {
      const r = resultMap[echoKw]
      if (r?.value && r.value.trim() !== '') {
        measurements[checkupId] = r.value
      }
    }

    // ── 2. AI에 전달할 소견 텍스트 구성 ──────────────────────────────
    const lines: string[] = []

    // 주요 계측값 + 해석
    const PRIORITY_KEYWORDS = [
      'FS', 'LVIDDN', 'LAAO', 'VSd', 'LVWd', 'TR_vel', 'AV_velocity',
      'MR', 'TR', 'MV_E', 'EAratio', 'IVRT', 'DT', 'Em', 'EEm',
      'LVd', 'LVs', 'AO', 'LA', 'PA_velocity', 'PAAO',
    ]
    const orderedKeys = [
      ...PRIORITY_KEYWORDS.filter((k) => resultMap[k]),
      ...Object.keys(resultMap).filter((k) => !PRIORITY_KEYWORDS.includes(k)),
    ]

    for (const kw of orderedKeys) {
      const r = resultMap[kw]
      if (!r || (!r.value && !r.result)) continue
      const parts: string[] = [`[${kw}]`]
      if (r.value) parts.push(`값: ${r.value}`)
      if (r.result) parts.push(`해석: ${r.result}`)
      if (r.comment) parts.push(`(${r.comment})`)
      lines.push(parts.join(' '))
    }

    if (echoData.memo?.trim()) {
      lines.push(`\n[수의사 메모/소견]\n${echoData.memo.trim()}`)
    }

    if (lines.length === 0) {
      return {
        data: {
          measurements,
          checked: {},
          notes: {} as Record<EchoCategoryId, string>,
        },
        error: null,
      }
    }

    // ── 3. AI 프롬프트 구성 ──────────────────────────────────────────
    const findingsList = echoCategories
      .map(
        (cat) =>
          `[${cat.id}] ${cat.label}:\n` +
          cat.findings.map((f) => `  • ${f.id}: ${f.label} (${f.severity})`).join('\n'),
      )
      .join('\n\n')

    const measurementHints = echoMeasurements
      .map((m) => `${m.id} = ${m.nameKo} (${m.nameEn}), 정상: dog ${m.defaultRefRange.dog} / cat ${m.defaultRefRange.cat}`)
      .join('\n')

    const systemPrompt = `You are a veterinary cardiologist AI assistant.
You receive echocardiography data and map findings to a structured checkup form.
Return ONLY valid JSON. No prose, no markdown outside JSON.`

    const userPrompt = `PATIENT SPECIES: ${species === 'cat' ? '고양이(Feline)' : '개(Canine)'}

=== ECHO CHART DATA ===
${lines.join('\n')}

=== CHECKUP MEASUREMENT REFERENCE ===
${measurementHints}

=== AVAILABLE CHECKUP FINDING IDs ===
${findingsList}

Return this exact JSON (no other text):
{
  "checked": ["finding_id_1", "finding_id_2"],
  "notes": {
    "category_id": "한국어 1-2문장 임상 소견"
  }
}

RULES:
1. Only include finding IDs clearly supported by echo data. Never hallucinate.
2. For 'notes': only include category_id keys that have relevant echo data or selected findings.
3. Notes must be concise clinical observations in Korean (1-2 sentences max).
4. The "checked" array should reflect ALL clinically relevant findings from the data.
5. Consider species-specific thresholds (cat IVSd/LVFWd ≥6mm = HCM; dog uses weight-based refs).`

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = rawText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const aiResult = JSON.parse(stripped)

    const checked: Record<string, boolean> = {}
    for (const id of aiResult.checked ?? []) {
      checked[String(id)] = true
    }

    return {
      data: {
        measurements,
        checked,
        notes: (aiResult.notes ?? {}) as Record<EchoCategoryId, string>,
      },
      error: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('credit') || msg.includes('quota')) {
      return { data: null, error: 'Anthropic API 크레딧이 부족합니다.' }
    }
    return { data: null, error: `Echo 결과 자동 입력 중 오류: ${msg}` }
  }
}

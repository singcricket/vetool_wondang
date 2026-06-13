'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import type { MsMemoSchedule } from '@/types/monitoring/monitoring-type'
import type { MemoColor } from '@/types/icu/chart'
import type { MsTemplateChart } from '@/lib/services/monitoring/fetch-ms-data'
import { stepsToMemos } from '@/lib/utils/treatment-plan-utils'
import { insertMsTemplateChart } from '@/lib/services/monitoring/ms-register'

export type TreatmentStep = {
  memo: string
  description: string
  caution: string | null
  schedule: MsMemoSchedule | null
  color: MemoColor
}

// 기존 템플릿에서 이름 매칭 검색
export async function searchTreatmentTemplates(
  procedureName: string,
  hosId: string,
): Promise<{ data: MsTemplateChart[]; error: string | null }> {
  if (!procedureName.trim()) return { data: [], error: null }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitoring_sessions_template')
    .select('*')
    .eq('hos_id', hosId)
    .ilike('session_template_title', `%${procedureName.trim()}%`)
    .order('session_template_title', { ascending: true })
    .limit(5)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as MsTemplateChart[], error: null }
}

// AI로 처치 단계 생성
export async function generateTreatmentPlan(params: {
  procedureName: string
  species: 'canine' | 'feline' | null
  detailLevel: 'detailed' | 'brief'
}): Promise<{ data: TreatmentStep[] | null; error: string | null }> {
  const { procedureName, species, detailLevel } = params
  const sp = species ?? 'canine'

  try {
    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `당신은 수의학 전문가입니다. 동물병원에서 사용하는 처치/시술 프로토콜을 단계별로 안내합니다.

처치명: ${procedureName}
환자 종: ${sp === 'feline' ? '고양이(Feline)' : '개(Canine)'}
상세도: ${detailLevel === 'detailed' ? '상세 (각 단계별 구체적인 설명, 팁, 주의사항 포함)' : '간략 (핵심 단계만)'}

위 처치에 대한 단계별 프로토콜을 JSON 배열로 반환하세요.

각 단계 필드:
- memo: 단계명 (간결하게, 예: "혈액검사 (CBC, Chemistry)")
- description: ${detailLevel === 'detailed' ? '상세 설명, 팁, 검사 항목 등 (2-4문장)' : '핵심 내용 1문장'}
- caution: 주의사항 또는 위험요소 (없으면 null)
- schedule: 시간 정보는 의학적으로 타이밍이 매우 중요한 경우에만 설정, 그 외에는 반드시 null
  * 시간 설정이 필요한 경우: ACTH 자극시험·인슐린 자극시험 등 호르몬 검사의 채혈 시점, 조영제 투여 후 촬영 시점, 항암제·독소루비신 등 투여 속도·간격이 중요한 경우, 수액 속도 변경 시점 등 타이밍 오차가 검사 결과나 환자 안전에 직접 영향을 주는 단계
  * 시간 설정 불필요(null): 일반 처치 준비, 환자 보정, 혈관 확보, 모니터링 연결, 투약 후 일반 관찰 등 순서만 중요하고 정확한 시간이 필요 없는 단계
  * {"type":"absolute","value":"00:00"} — 시술 시작 기준 절대 시각
  * {"type":"after_start","value":30} — 시작 후 N분 (예: ACTH 투여 후 60분 채혈)
  * {"type":"after_prev","value":15} — 이전 단계 완료 후 N분
- color: 단계 성격에 맞는 색상
  * "#e0f2fe" — 준비/검사 단계 (파란색)
  * "#fef9c3" — 처치/시술 단계 (노란색)
  * "#fce7f3" — 주의/위험 단계 (분홍색)
  * "#d1fae5" — 회복/완료 단계 (초록색)
  * "#ede9fe" — 모니터링/추적 단계 (보라색)

규칙:
- 수의학적으로 정확한 내용만 포함
- 약물 용량은 범위로 제시하고 체중 기반 계산 안내
- 단계 수: ${detailLevel === 'detailed' ? '6-12개' : '3-6개'}
- schedule이 null인 단계가 대부분이어야 함 (타이밍이 중요한 단계에만 예외적으로 설정)

JSON 배열만 반환 (다른 텍스트 없이):
[{"memo":"...","description":"...","caution":null,"schedule":{"type":"absolute","value":"00:00"},"color":"#e0f2fe"}]`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()

    let parsed: TreatmentStep[]
    try {
      parsed = JSON.parse(stripped)
    } catch {
      // 응답이 잘린 경우 마지막 완전한 객체까지만 복구
      const lastBrace = stripped.lastIndexOf('},')
      const recovered = lastBrace > 0 ? stripped.slice(0, lastBrace + 1) + ']' : null
      if (!recovered) throw new Error('JSON 파싱 실패 — 응답이 너무 짧습니다')
      parsed = JSON.parse(recovered)
    }
    return { data: parsed, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { data: null, error: `처치 계획 생성 실패: ${msg}` }
  }
}

// 처치 계획을 템플릿으로 저장
export async function saveTreatmentAsTemplate(params: {
  hosId: string
  templateName: string
  steps: TreatmentStep[]
  procedureDescription: string
}): Promise<{ error: string | null }> {
  const { hosId, templateName, steps, procedureDescription } = params
  try {
    await insertMsTemplateChart(hosId, {
      session_template_title: templateName,
      session_comment: procedureDescription,
      interval_setting: 0,
      planned_vitals: [],
      vital_results: [],
      memo_tx: stepsToMemos(steps),
    })
    return { error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
}

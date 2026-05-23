'use server'

import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import type { CheckupPatient } from '@/types/hospital/checkup-type'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'

// ── 결과 타입 ─────────────────────────────────────────────────

export type PlanAnalysisResult = {
  // 1. 기관별 진단
  dx_musculoskeletal: string
  dx_cardio_resp: string
  dx_hepatobiliary: string
  dx_endocrine: string
  dx_urogenital: string
  dx_oral: string
  dx_ophthalmic: string
  dx_neuro: string
  // 2. 치료 및 관리계획
  tx_surgery: string
  tx_medication: string
  tx_diet_plan: string
  tx_further_workup: string
  tx_monitoring: string
  tx_priority_summary: string
  // 3. 생활 관리 가이드
  guide_diet: string
  guide_weight: string
  guide_exercise: string
  guide_environment: string
  // 4. 추적 관찰 계획
  followup_plan: string
}

// ── 헬퍼 ─────────────────────────────────────────────────────

function calcAge(birth: string | null): string {
  if (!birth) return '나이 정보 없음'
  const b = new Date(birth)
  const today = new Date()
  const totalMonths =
    (today.getFullYear() - b.getFullYear()) * 12 +
    (today.getMonth() - b.getMonth()) +
    (today.getDate() < b.getDate() ? -1 : 0)
  if (totalMonths < 12) return `${totalMonths}개월령`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월령` : `${y}세령`
}

function extractJson(text: string): PlanAnalysisResult {
  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON not found in response')
  return JSON.parse(clean.slice(start, end + 1))
}

// ── 섹션 데이터 → 가독성 있는 텍스트 변환 ─────────────────────

function buildSummary(
  sections: { section_type: string; data: Record<string, unknown> }[],
  patient: CheckupPatient,
): string {
  const get = (type: string) =>
    (sections.find((s) => s.section_type === type)?.data ?? {}) as Record<string, unknown>

  const speciesKo = /^(cat|feline)$/i.test(patient.species) ? '고양이' : '개'
  const lines: string[] = []

  // 환자 기본 정보
  lines.push('[환자 기본 정보]')
  lines.push(
    `종: ${speciesKo}, 품종: ${patient.breed || '혼종'}, 나이: ${calcAge(patient.birth)}, 성별: ${patient.gender || '정보없음'}`,
  )
  lines.push('')

  // 문진
  const inq = get('inquiry')
  if (Object.keys(inq).length) {
    lines.push('[문진]')
    const liveType = inq.living_type
    if (liveType) {
      const lvMap: Record<string, string> = { indoor: '실내', outdoor: '실외', mixed: '복합' }
      lines.push(`생활환경: ${lvMap[liveType as string] ?? liveType}`)
    }
    if (inq.diet_main) lines.push(`주사료: ${inq.diet_main}`)
    if (inq.diet_treats) lines.push(`간식/부식: ${inq.diet_treats}`)
    if (inq.diet_allergies) lines.push(`알러지/금기: ${inq.diet_allergies}`)
    if (inq.chief_complaint) lines.push(`주호소: ${inq.chief_complaint}`)
    if (inq.past_history) lines.push(`과거병력: ${inq.past_history}`)
    if (inq.current_diseases) lines.push(`현재 관리 질환: ${inq.current_diseases}`)
    const vitMap: Record<string, string> = { good: '양호', fair: '보통', poor: '저하' }
    const appMap: Record<string, string> = { normal: '정상', increased: '증가', decreased: '감소' }
    if (inq.condition_vitality) lines.push(`활력: ${vitMap[inq.condition_vitality as string] ?? inq.condition_vitality}`)
    if (inq.condition_appetite) lines.push(`식욕: ${appMap[inq.condition_appetite as string] ?? inq.condition_appetite}`)
    if (inq.condition_water) lines.push(`음수: ${appMap[inq.condition_water as string] ?? inq.condition_water}`)
    if (inq.condition_urination) lines.push(`배뇨: ${inq.condition_urination}`)
    if (inq.condition_defecation) lines.push(`배변: ${inq.condition_defecation}`)
    if (inq.condition_notes) lines.push(`기타 증상: ${inq.condition_notes}`)
    if (inq.vaccination) lines.push(`접종: ${inq.vaccination}`)
    if (inq.heartworm) lines.push(`사상충: ${inq.heartworm}`)
    lines.push('')
  }

  // 신체검사
  const phys = get('physical')
  if (Object.keys(phys).length) {
    lines.push('[신체검사]')
    if (phys.body_weight) lines.push(`체중: ${phys.body_weight}kg, BCS: ${phys.bcs ?? '?'}/9`)
    if (phys.temperature) {
      lines.push(`체온: ${phys.temperature}°C, 맥박: ${phys.pulse ?? '?'}bpm, 호흡: ${phys.respiration ?? '?'}회/분`)
    }
    if (phys.notes && typeof phys.notes === 'object') {
      for (const [cat, note] of Object.entries(phys.notes as Record<string, string>)) {
        if (note) lines.push(`신체검사 ${cat}: ${note}`)
      }
    }
    lines.push('')
  }

  // 임상병리
  const lab = get('lab')
  const labItems = (lab.items as LabResultItem[] | undefined) ?? []
  const abnormalItems = labItems.filter((i) => i.is_abnormal && i.value != null)
  if (abnormalItems.length) {
    lines.push('[임상병리 이상소견]')
    for (const item of abnormalItems) {
      const sev = item.severity ? ` [${item.severity}]` : ''
      const ref = item.ref_range ? ` (기준: ${item.ref_range})` : ''
      lines.push(`${item.nameKo} (${item.nameEn}): ${item.value}${item.unit}${ref}${sev} — ${item.result_text ?? ''}`)
      if (item.comment) lines.push(`  ↳ ${item.comment}`)
    }
    lines.push('')
  }

  // 방사선
  const xray = get('xray')
  if (Object.keys(xray).length) {
    const checked = xray.checked as Record<string, boolean> | undefined
    const notes = xray.notes as Record<string, string> | undefined
    const meas = xray.measurements as Record<string, string> | undefined
    const checkedList = checked ? Object.entries(checked).filter(([, v]) => v).map(([k]) => k) : []
    if (checkedList.length || notes || meas) {
      lines.push('[방사선 소견]')
      if (checkedList.length) lines.push(`이상소견: ${checkedList.join(', ')}`)
      if (meas) {
        const measList = Object.entries(meas).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`)
        if (measList.length) lines.push(`계측: ${measList.join(', ')}`)
      }
      if (notes) {
        for (const [cat, note] of Object.entries(notes)) {
          if (note) lines.push(`${cat} 소견: ${note}`)
        }
      }
      lines.push('')
    }
  }

  // 복부초음파
  const us = get('ultrasound_basic')
  const organNotes = (us.organ_notes as Record<string, string> | undefined) ?? {}
  const nonEmptyOrgans = Object.entries(organNotes).filter(([, v]) => v?.trim())
  if (nonEmptyOrgans.length) {
    lines.push('[복부초음파]')
    for (const [organ, note] of nonEmptyOrgans) {
      lines.push(`${organ}: ${note}`)
    }
    lines.push('')
  }

  // 심장초음파
  const echo = get('echo_basic')
  if (Object.keys(echo).length) {
    const echoChecked = echo.checked as Record<string, boolean> | undefined
    const echoMeas = echo.measurements as Record<string, string> | undefined
    const echoList = echoChecked ? Object.entries(echoChecked).filter(([, v]) => v).map(([k]) => k) : []
    if (echoList.length || echoMeas) {
      lines.push('[심장초음파]')
      if (echoList.length) lines.push(`소견: ${echoList.join(', ')}`)
      if (echoMeas) {
        const measList = Object.entries(echoMeas).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`)
        if (measList.length) lines.push(`계측: ${measList.join(', ')}`)
      }
      lines.push('')
    }
  }

  // CT/MRI
  const ct = get('ct_mri')
  if (ct.notes) {
    lines.push('[CT/MRI/내시경]')
    lines.push(ct.notes as string)
    lines.push('')
  }

  // 치과
  const dental = get('dental_basic')
  if (dental.notes) {
    lines.push('[치과]')
    lines.push(dental.notes as string)
    lines.push('')
  }

  // 안과
  const ophthalmic = get('ophthalmic_basic')
  if (ophthalmic.notes) {
    lines.push('[안과]')
    lines.push(ophthalmic.notes as string)
    lines.push('')
  }

  // 신경계
  const neuro = get('neuro_basic')
  if (neuro.notes) {
    lines.push('[신경계]')
    lines.push(neuro.notes as string)
    lines.push('')
  }

  return lines.join('\n')
}

// ── 메인 액션 ─────────────────────────────────────────────────

export async function generatePlanSections(params: {
  checkupId: string
  patient: CheckupPatient
}): Promise<PlanAnalysisResult> {
  const supabase = await createClient()

  const { data: sections, error } = await supabase
    .from('checkup_sections')
    .select('section_type, data')
    .eq('checkup_id', params.checkupId)

  if (error) throw new Error(`섹션 로드 실패: ${error.message}`)

  const summary = buildSummary(
    (sections ?? []) as { section_type: string; data: Record<string, unknown> }[],
    params.patient,
  )

  const prompt = `당신은 수의 내과·외과·영상 전문의입니다.
아래 건강검진 데이터를 분석하여 각 항목을 한국어로 작성하고 JSON만 반환하세요 (코드블록·설명 없이).

작성 원칙:
- 보호자에게 쉽게 설명하는 관점으로 작성
- 이상 소견 없는 계통은 "이상 소견 없음" 또는 "정상 범위 내"로 간단히 표기
- 이상 소견이 있으면 소견 + 보호자 이해용 간략 설명 포함
- tx_priority_summary는 1순위(즉각치료)→2순위(적극관리)→3순위(모니터링)→4순위(정기관찰) 형식으로 번호 목록
- guide_weight: 체중·BCS 기반 목표체중 및 하루 칼로리(kcal ME) 추정치 포함
- followup_plan: "N개월 후: 검사항목" 형식, 복수 시점 가능
- 항목당 2~8줄, 임상적으로 의미있고 실용적인 내용

[건강검진 데이터]
${summary}

반환 JSON 구조 (키 정확히 일치):
{
  "dx_musculoskeletal": "근골격계 진단 및 평가",
  "dx_cardio_resp": "심혈관/호흡기 진단 및 평가",
  "dx_hepatobiliary": "간담도계 진단 및 평가",
  "dx_endocrine": "내분비계 진단 및 평가",
  "dx_urogenital": "비뇨/생식기 진단 및 평가",
  "dx_oral": "구강 진단 및 평가",
  "dx_ophthalmic": "안과 진단 및 평가",
  "dx_neuro": "신경계 진단 및 평가",
  "tx_surgery": "외과 수술/시술 계획 (없으면 '해당 없음')",
  "tx_medication": "내과 약물/주사 치료 계획",
  "tx_diet_plan": "식이관리 계획",
  "tx_further_workup": "추가 정밀검사 계획",
  "tx_monitoring": "주기적 모니터링 항목",
  "tx_priority_summary": "치료·관리 우선순위 요약",
  "guide_diet": "식이관리 가이드 (체중·BCS·질환 맞춤형)",
  "guide_weight": "체중관리 (목표체중·칼로리 포함)",
  "guide_exercise": "운동 및 활동 관리",
  "guide_environment": "환경 및 기본관리",
  "followup_plan": "추적 관찰 계획"
}`

  const client = getAnthropicClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content.find((b) => b.type === 'text')?.text ?? ''
  return extractJson(text)
}

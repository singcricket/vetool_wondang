import {
  physicalRefAll,
  PHYSICAL_SECTION_ORDER,
  PHYSICAL_SECTION_LABEL,
} from '@/constants/hospital/checkup/physical-ref'
import { xrayCategories, xrayFindingMap } from '@/constants/hospital/checkup/xray-ref'
import { echoCategories, echoFindingMap } from '@/constants/hospital/checkup/echo-ref'
import { organSections } from '@/constants/hospital/ultrasound'
import type { CheckupSection } from '@/types/hospital/checkup-type'

type D = Record<string, unknown>

function line(label: string, value: string | undefined | null, unit?: string): string | null {
  if (!value || value.trim() === '') return null
  return `- ${label}: ${value}${unit ? ' ' + unit : ''}`
}

// ── 문진 ────────────────────────────────────────────────────

function buildInquiryText(data: D): string {
  const lines: string[] = ['[문진]']

  if (data.chief_complaint) lines.push(`- 주호소: ${data.chief_complaint}`)
  if (data.past_history) lines.push(`- 병력: ${data.past_history}`)
  if (data.current_diseases) lines.push(`- 현재 질환: ${data.current_diseases}`)
  if (data.prev_checkup) lines.push(`- 이전 검진: ${data.prev_checkup}`)

  const livingParts: string[] = []
  if (data.living_type) livingParts.push({ indoor: '실내', outdoor: '실외', mixed: '실내외 혼합' }[data.living_type as string] ?? String(data.living_type))
  if (data.diet_main) livingParts.push(`주식: ${data.diet_main}`)
  if (data.diet_treats) livingParts.push(`간식: ${data.diet_treats}`)
  if (data.diet_allergies) livingParts.push(`알러지: ${data.diet_allergies}`)
  if (data.toilet_env) livingParts.push(`화장실: ${data.toilet_env}`)
  if (data.living_other) livingParts.push(String(data.living_other))
  if (livingParts.length) lines.push(`- 생활환경/식이: ${livingParts.join(' / ')}`)

  const condParts: string[] = []
  if (data.condition_vitality) condParts.push(`활력 ${({ good: '양호', fair: '보통', poor: '저하' }[data.condition_vitality as string] ?? String(data.condition_vitality))}`)
  if (data.condition_appetite) condParts.push(`식욕 ${({ normal: '정상', increased: '증가', decreased: '감소' }[data.condition_appetite as string] ?? String(data.condition_appetite))}`)
  if (data.condition_water) condParts.push(`음수 ${({ normal: '정상', increased: '증가', decreased: '감소' }[data.condition_water as string] ?? String(data.condition_water))}`)
  if (data.condition_urination) condParts.push(`배뇨: ${data.condition_urination}`)
  if (data.condition_defecation) condParts.push(`배변: ${data.condition_defecation}`)
  if (condParts.length) lines.push(`- 최근 컨디션: ${condParts.join(' / ')}`)
  if (data.condition_notes) lines.push(`- 컨디션 비고: ${data.condition_notes}`)

  const prevParts: string[] = []
  if (data.vaccination) prevParts.push(`접종: ${data.vaccination}`)
  if (data.heartworm) prevParts.push(`심장사상충: ${data.heartworm}`)
  if (data.internal_parasite) prevParts.push(`내부기생충: ${data.internal_parasite}`)
  if (data.external_parasite) prevParts.push(`외부기생충: ${data.external_parasite}`)
  if (prevParts.length) lines.push(`- 예방: ${prevParts.join(' / ')}`)

  return lines.length > 1 ? lines.join('\n') : ''
}

// ── 신체검사 ────────────────────────────────────────────────

function buildPhysicalText(data: D): string {
  const lines: string[] = ['[신체검사]']

  for (const section of PHYSICAL_SECTION_ORDER) {
    const items = physicalRefAll.filter((r) => r.section === section && r.inputType !== 'custom')
    const sectionLines: string[] = []

    for (const ref of items) {
      const val = data[ref.id]
      if (!val || String(val).trim() === '') continue
      sectionLines.push(`  - ${ref.nameKo}: ${val}${ref.unit ? ' ' + ref.unit : ''}`)
    }

    // 관절 소견 (musculoskeletal custom)
    if (section === 'musculoskeletal') {
      const jointAffected = data['joint_affected'] as string | undefined
      const evalJsonRaw = data['joint_eval_json'] as string | undefined
      if (jointAffected?.trim()) {
        const joints = jointAffected.split(',').map((j) => j.trim()).filter(Boolean)
        let evalMap: Record<string, { findings: string[]; note?: string }> = {}
        try {
          const raw = JSON.parse(evalJsonRaw || '{}')
          for (const [k, v] of Object.entries(raw)) {
            evalMap[k] = Array.isArray(v) ? { findings: v as string[] } : v as { findings: string[]; note?: string }
          }
        } catch { /* ignore */ }

        const jointParts = joints.map((j) => {
          const entry = evalMap[j]
          if (!entry || entry.findings.length === 0) return j
          const suffix = entry.note ? ` (${entry.findings.join(', ')}; ${entry.note})` : ` (${entry.findings.join(', ')})`
          return j + suffix
        })
        sectionLines.push(`  - 이상 관절: ${jointParts.join(' / ')}`)
      }
    }

    if (sectionLines.length > 0) {
      lines.push(PHYSICAL_SECTION_LABEL[section])
      lines.push(...sectionLines)
    }
  }

  return lines.length > 1 ? lines.join('\n') : ''
}

// ── 임상병리 (이상 항목만) ───────────────────────────────────

interface LabResultItem {
  id: string
  nameKo?: string
  value?: string | number | null
  unit?: string | null
  ref_range?: string | null
  is_abnormal?: boolean | null
  result_text?: string | null
  comment?: string | null
}

const LAB_SECTION_LABEL: Record<string, string> = {
  cbc: 'CBC (혈액검사)',
  chemistry: '혈청화학',
  endocrine: '내분비',
  urinalysis: '요검사',
  blood_gas: '혈액가스검사',
  coagulation: '응고계',
  special: '특수검사',
  none: '기타',
}

function buildLabText(data: D): string {
  const items = (data.items ?? []) as LabResultItem[]
  const abnormal = items.filter((i) => i.is_abnormal === true && i.value !== null && i.value !== undefined)
  if (abnormal.length === 0) return ''

  const lines: string[] = ['[임상병리 - 이상 항목]']
  for (const item of abnormal) {
    const valStr = `${item.value ?? ''}${item.unit ? ' ' + item.unit : ''}`
    const refStr = item.ref_range ? ` (참고: ${item.ref_range})` : ''
    const commentStr = item.comment ? ` → ${item.comment}` : ''
    const resultStr = item.result_text ? ` [${item.result_text}]` : ''
    lines.push(`  - ${item.nameKo ?? item.id}: ${valStr}${refStr}${resultStr}${commentStr}`)
  }
  return lines.join('\n')
}

// ── 영상검사 ────────────────────────────────────────────────

function buildImagingText(
  xrayData: D,
  usData: D,
  echoData: D,
  ctMriData: D,
): string {
  const blocks: string[] = []

  // 방사선
  const xrayChecked = (xrayData.checked ?? {}) as Record<string, boolean>
  const xrayNotes = (xrayData.notes ?? {}) as Record<string, string>
  const xrayLines: string[] = ['[영상검사 - 방사선]']
  let hasXray = false

  for (const cat of xrayCategories) {
    const catFindings = cat.findings.filter((f) => xrayChecked[f.id])
    const catNote = xrayNotes[cat.id]?.trim()
    if (catFindings.length === 0 && !catNote) continue
    hasXray = true
    xrayLines.push(cat.label)
    if (catFindings.length > 0) {
      xrayLines.push(`  소견: ${catFindings.map((f) => f.label).join(', ')}`)
    }
    if (catNote) xrayLines.push(`  비고: ${catNote}`)
  }
  if (hasXray) blocks.push(xrayLines.join('\n'))

  // 초음파
  const usOrganNotes = (usData.organ_notes ?? {}) as Record<string, string>
  const usLines: string[] = ['[영상검사 - 초음파]']
  let hasUs = false
  for (const sec of organSections) {
    const note = usOrganNotes[sec.organ]?.trim()
    if (!note) continue
    hasUs = true
    usLines.push(`  ${sec.organNameKo}: ${note}`)
  }
  if (hasUs) blocks.push(usLines.join('\n'))

  // 심장초음파
  const echoChecked = (echoData.checked ?? {}) as Record<string, boolean>
  const echoNotes = (echoData.notes ?? {}) as Record<string, string>
  const echoLines: string[] = ['[영상검사 - 심장초음파]']
  let hasEcho = false
  for (const cat of echoCategories) {
    const catFindings = cat.findings.filter((f) => echoChecked[f.id])
    const catNote = echoNotes[cat.id]?.trim()
    if (catFindings.length === 0 && !catNote) continue
    hasEcho = true
    echoLines.push(cat.label)
    if (catFindings.length > 0) echoLines.push(`  소견: ${catFindings.map((f) => f.label).join(', ')}`)
    if (catNote) echoLines.push(`  비고: ${catNote}`)
  }
  if (hasEcho) blocks.push(echoLines.join('\n'))

  // CT/MRI
  const ctNotes = (ctMriData.notes as string)?.trim()
  if (ctNotes) blocks.push(`[영상검사 - CT/MRI]\n${ctNotes}`)

  return blocks.join('\n\n')
}

// ── 치료 및 관리계획 ────────────────────────────────────────

function buildPlanText(data: D): string {
  const fields: Array<{ key: string; label: string }> = [
    { key: 'tx_priority_summary',  label: '치료·관리 우선순위 요약' },
    { key: 'tx_surgery',           label: '외과 수술 / 시술 계획' },
    { key: 'tx_medication',        label: '내과 약물 / 주사 치료' },
    { key: 'tx_diet_plan',         label: '식이관리 계획' },
    { key: 'tx_further_workup',    label: '추가 정밀검사' },
    { key: 'tx_monitoring',        label: '주기적 모니터링' },
  ]

  const lines: string[] = ['[치료 및 관리계획]']
  for (const { key, label } of fields) {
    const val = (data[key] as string)?.trim()
    if (!val) continue
    lines.push(`${label}`)
    for (const row of val.split('\n')) {
      if (row.trim()) lines.push(`  ${row.trim()}`)
    }
  }

  if (data.followup_plan) {
    const val = (data.followup_plan as string).trim()
    if (val) {
      lines.push('추적 관찰 계획')
      for (const row of val.split('\n')) {
        if (row.trim()) lines.push(`  ${row.trim()}`)
      }
    }
  }

  if (data.next_checkup_date) {
    lines.push(`- 다음 건강검진 예정일: ${data.next_checkup_date}`)
  }

  return lines.length > 1 ? lines.join('\n') : ''
}

// ── 메인 ────────────────────────────────────────────────────

export function buildCheckupText(sections: CheckupSection[]): string {
  const getSection = (type: string) => sections.find((s) => s.section_type === type)

  const inquiryData = (getSection('inquiry')?.data ?? {}) as D
  const physicalData = (getSection('physical')?.data ?? {}) as D
  const labData = (getSection('lab')?.data ?? {}) as D
  const xrayData = (getSection('xray')?.data ?? {}) as D
  const usData = (getSection('ultrasound_basic')?.data ?? {}) as D
  const echoData = (getSection('echo_basic')?.data ?? {}) as D
  const ctMriData = (getSection('ct_mri')?.data ?? {}) as D
  const planData = (getSection('plan')?.data ?? {}) as D

  const parts = [
    buildInquiryText(inquiryData),
    buildPhysicalText(physicalData),
    buildLabText(labData),
    buildImagingText(xrayData, usData, echoData, ctMriData),
    buildPlanText(planData),
  ].filter(Boolean)

  return parts.join('\n\n')
}

'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Image as ImageIcon, FileDown, Loader2, Microscope } from 'lucide-react'
import type { CytologyChartDetail } from '@/types/hospital/cytology-type'
import type { CytologyEngineOutput, CytologySampleType, CytologyMode } from '@/constants/hospital/cytology/cytology-types'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'
import {
  computeFluidHints,
  computeWbcHints,
  computeRbcHints,
  computePltHints,
  computeReticulocyte,
  DC_FIELDS,
} from '@/constants/hospital/cytology/cytology-hints'

export const SAMPLE_LABELS: Record<CytologySampleType, string> = {
  otic: '귀도말 (Otic Swab)',
  skin_impression: '피부 인상도말 (Skin Impression)',
  skin_exudate: '피부 삼출물 도말 (Skin Exudate)',
  fecal: '분변염색 (Fecal Cytology)',
  blood_smear: '혈액도말 (Blood Smear)',
  fna_skin: 'FNA - 피부/피하 (FNA Skin)',
  fna_lymph: 'FNA - 림프절 (FNA Lymph Node)',
  fna_organ: 'FNA - 내부 장기 (FNA Organ)',
  effusion: '체강액 (Effusion)',
  synovial: '관절액 (Synovial Fluid)',
  csf: '뇌척수액 (CSF)',
  bal: '기관지폐포세척액 (BAL)',
}

interface Props {
  chartDetail: CytologyChartDetail
  activeSamples: CytologySampleType[]
  samplesData: Record<string, { findings: Record<string, string | string[]>; impression: string; mode: CytologyMode; impressionAiFilled: boolean }>
  engineOutputs: Record<string, CytologyEngineOutput>
}

// ── Shared helpers ────────────────────────────────────────────

function calcAge(birth: string): string {
  const today = new Date()
  const b = new Date(birth)
  const years = today.getFullYear() - b.getFullYear()
  const months = today.getMonth() - b.getMonth()
  if (years === 0) return `${Math.max(0, months + (months < 0 ? 12 : 0))}개월`
  return `${years}세`
}

function buildFilename(chartDetail: CytologyChartDetail, sampleTypes: CytologySampleType[], ext: string): string {
  const name = chartDetail.patient?.name ?? 'report'
  const date = chartDetail.chart_date ?? new Date().toISOString().slice(0, 10)
  const sample = sampleTypes.length === 1 ? sampleTypes[0].replace('_', '-') : `${sampleTypes.length}samples`
  return `cytology_${name}_${date}_${sample}.${ext}`
}

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default
  return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
}

// ── Plain-text report generator (for TXT copy button) ─────────

export function generateReportText(
  chartDetail: CytologyChartDetail,
  sampleType: CytologySampleType,
  findings: Record<string, string | string[]>,
  engineOutput: CytologyEngineOutput | null,
  aiSummary?: string | null,
): string {
  const lines: string[] = []
  const patient = chartDetail.patient
  const now = new Date().toLocaleDateString('ko-KR')

  lines.push('══════════════════════════════════════')
  lines.push('     세포학 검사 판독 보고서 (Cytology Report)')
  lines.push('══════════════════════════════════════')
  lines.push('')
  lines.push('[환자 정보]')
  lines.push(`이름: ${patient?.name ?? '-'}`)
  lines.push(`종/품종: ${patient?.species === 'cat' ? '고양이' : '개'} / ${patient?.breed ?? '-'}`)
  lines.push(`성별: ${patient?.gender ?? '-'}`)
  lines.push(`병원 번호: ${patient?.hos_patient_id ?? '-'}`)
  lines.push(`보호자: ${patient?.owner_name ?? '-'}`)
  lines.push('')
  lines.push('[검사 정보]')
  lines.push(`검체 종류: ${SAMPLE_LABELS[sampleType]}`)
  lines.push(`검사일: ${chartDetail.chart_date}`)
  lines.push(`보고일: ${now}`)
  lines.push(`판독의: ${chartDetail.evaluator?.name ?? '-'}`)

  const sampleDef = cytologyReference.getSampleDef(sampleType)
  if (sampleDef) lines.push(`염색법: ${sampleDef.stainMethods.join(', ')}`)

  lines.push('')
  lines.push('[소견]')

  if (Object.keys(findings).length === 0) {
    lines.push('(소견 없음)')
  } else if (sampleDef) {
    for (const section of sampleDef.sections) {
      const sectionFindings = section.tests
        .filter((t) => {
          const v = findings[t.testId]
          return v !== undefined && v !== '' && v !== 'none' && v !== 'absent' && v !== 'normal'
        })
        .map((t) => {
          const val = findings[t.testId]
          const opt = t.options?.find((o) => o.value === val)
          return `  ${t.label}: ${opt?.label ?? String(val)}`
        })
      if (sectionFindings.length > 0) {
        lines.push(`\n▸ ${section.label}`)
        sectionFindings.forEach((f) => lines.push(f))
      }
    }
  } else {
    const QUALITY_LABELS: Record<string, string> = {
      sq_cellularity: '세포충실성', sq_hemodilution: '혈액 희석', sq_necrosis: '괴사',
    }
    const QUALITY_VALUE_LABELS: Record<string, string> = {
      low: '낮음', moderate: '중등도', high: '높음',
      none: '없음', mild: '경도', severe: '심함', present: '있음',
    }
    const qualityLines = Object.entries(QUALITY_LABELS)
      .filter(([id]) => findings[id] && findings[id] !== 'none')
      .map(([id, label]) => `  ${label}: ${QUALITY_VALUE_LABELS[findings[id] as string] ?? findings[id]}`)
    if (qualityLines.length) { lines.push('\n▸ 검체 품질'); qualityLines.forEach((l) => lines.push(l)) }

    const INFL_LABELS: Record<string, string> = {
      neutrophilic_pure: '호중구성 (비패혈성)', neutrophilic_septic: '호중구성 (패혈성)',
      macrophagic: '대식세포성', eosinophilic: '호산구성', lymphocytic: '림프구성', mixed: '혼합성',
    }
    const inflType = findings['infl_type'] as string
    const inflLines: string[] = []
    if (inflType && inflType !== 'none') inflLines.push(`  염증 유형: ${INFL_LABELS[inflType] ?? inflType}`)
    if (findings['infl_degenerate_neutrophils'] === 'true') inflLines.push('  변성 호중구: 있음')
    if (findings['infl_giant_cells'] === 'true') inflLines.push('  다핵 거대세포: 있음')
    if (findings['infl_plasma_cells'] === 'true') inflLines.push('  형질세포: 있음')
    if (inflLines.length) { lines.push('\n▸ 염증 평가'); inflLines.forEach((l) => lines.push(l)) }

    const identifiedRaw = findings['identified_cells']
    const identifiedCells: string[] = Array.isArray(identifiedRaw)
      ? identifiedRaw : identifiedRaw ? [identifiedRaw as string] : []
    if (identifiedCells.length > 0) {
      lines.push('\n▸ 세포 분류')
      cytologyReference.cellTypes
        .filter((c) => identifiedCells.includes(c.cellId))
        .forEach((cellDef) => {
          lines.push(`  [${cellDef.nameKo}]`)
          cellDef.morphTests.forEach((mt) => {
            const v = findings[mt.testId]
            if (!v || v === '' || v === 'none') return
            const opt = mt.options?.find((o) => o.value === v)
            lines.push(`    ${mt.label}: ${opt?.label ?? String(v)}`)
          })
        })
    }

    const MALIG_LABELS: Record<string, string> = {
      malig_criteria_1: '세포 크기 다형성 (Anisocytosis)',
      malig_criteria_2: '핵 크기 다형성 (Anisokaryosis)',
      malig_criteria_3: '다형성 핵소체 (Prominent nucleoli)',
      malig_criteria_4: '유사분열상 (Mitotic figures)',
      malig_criteria_5: '핵 이형성 (Nuclear molding)',
    }
    const maligLines = Object.entries(MALIG_LABELS)
      .filter(([id]) => findings[id] === 'true')
      .map(([, label]) => `  ✓ ${label}`)
    if (maligLines.length) {
      lines.push(`\n▸ 악성도 기준 (${maligLines.length}/5 충족)`)
      maligLines.forEach((l) => lines.push(l))
    }

    const clinicalFields: [string, string][] = [
      ['mass_location', '병변 위치'], ['mass_size', '종괴 크기'],
      ['clinical_context', '임상 상황'], ['stain_method', '염색 방법'],
      ['evaluator_comment', '판독자 소견'],
    ]
    const clinicalLines = clinicalFields
      .filter(([id]) => findings[id] && findings[id] !== '')
      .map(([id, label]) => `  ${label}: ${findings[id]}`)
    if (clinicalLines.length) { lines.push('\n▸ 임상 소견'); clinicalLines.forEach((l) => lines.push(l)) }
  }

  // Blood smear section
  if (sampleType === 'blood_smear') {
    const sv = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
    const nv = (id: string) => { const v = findings[id]; const n = parseFloat(Array.isArray(v) ? v[0] : (v ?? '')); return isNaN(n) ? null : n }
    const dcRows = DC_FIELDS.map((f) => ({ ...f, val: nv(f.id) })).filter((f) => f.val !== null && f.val! > 0).sort((a, b) => (b.val ?? 0) - (a.val ?? 0))
    if (dcRows.length > 0) {
      lines.push('\n▸ 감별 백혈구 계수 (DC)')
      dcRows.forEach((f) => lines.push(`  ${f.label}: ${f.val}%`))
    }
    const TOXIC_LABELS: Record<string, string> = { none: '없음', rare: '소수', few: '적음', moderate: '중등도', many: '다수' }
    const toxicLines: string[] = []
    const dohle = sv('wbc_dohle'); const tgran = sv('wbc_toxic_gran'); const vacuol = sv('wbc_vacuolation')
    if (dohle && dohle !== 'none') toxicLines.push(`  Döhle bodies: ${TOXIC_LABELS[dohle] ?? dohle}`)
    if (tgran && tgran !== 'none') toxicLines.push(`  독성 과립: ${TOXIC_LABELS[tgran] ?? tgran}`)
    if (vacuol && vacuol !== 'none') toxicLines.push(`  세포질 공포화: ${TOXIC_LABELS[vacuol] ?? vacuol}`)
    if (sv('wbc_giant_bands') === 'present') toxicLines.push('  거대 Band: 있음')
    if (sv('wbc_hyperseg') === 'present') toxicLines.push('  과분엽: 있음')
    if (toxicLines.length) { lines.push('\n▸ 독성변화 (Toxic Changes)'); toxicLines.forEach((l) => lines.push(l)) }
    const GRADE_L: Record<string, string> = { none: '없음', mild: '경도', moderate: '중등도', marked: '현저' }
    const rbcLines: string[] = []
    const aniso = sv('rbc_anisocytosis'); const poly = sv('rbc_polychromasia'); const hypo = sv('rbc_hypochromia')
    if (aniso && aniso !== 'none') rbcLines.push(`  다양크기증: ${GRADE_L[aniso] ?? aniso}`)
    if (poly && poly !== 'none') rbcLines.push(`  다색성: ${GRADE_L[poly] ?? poly}`)
    if (hypo && hypo !== 'none') rbcLines.push(`  저색소증: ${GRADE_L[hypo] ?? hypo}`)
    if (sv('rbc_microcytosis') === 'present') rbcLines.push('  소구성: 있음')
    if (sv('rbc_macrocytosis') === 'present') rbcLines.push('  대구성: 있음')
    if (sv('rbc_autoagglutination') === 'present') rbcLines.push('  자가응집: 있음')
    if (sv('rbc_nucleated_rbc') === 'present') rbcLines.push('  유핵 적혈구: 있음')
    const poiki = Array.isArray(findings['rbc_poikilocytes']) ? findings['rbc_poikilocytes'] as string[] : []
    if (poiki.length > 0) rbcLines.push(`  형태 이상: ${poiki.join(', ')}`)
    const parasites = sv('rbc_parasites')
    if (parasites && parasites !== 'none') rbcLines.push(`  RBC 기생충: ${parasites}`)
    if (rbcLines.length) { lines.push('\n▸ 적혈구 평가'); rbcLines.forEach((l) => lines.push(l)) }
    const PLT_EST: Record<string, string> = { adequate: '정상', decreased: '감소', increased: '증가', cannot_estimate: '평가 불가' }
    const pltLines: string[] = []
    const pltEst = sv('plt_estimate')
    if (pltEst) pltLines.push(`  추정 개수: ${PLT_EST[pltEst] ?? pltEst}`)
    const perHpf = nv('plt_per_hpf')
    if (perHpf !== null) pltLines.push(`  HPF당: ${perHpf}개 → 추정 ${Math.round(perHpf * 15000).toLocaleString()}/μL`)
    if (sv('plt_large') !== 'absent' && sv('plt_large')) pltLines.push(`  거대혈소판: ${sv('plt_large')}`)
    if (sv('plt_clumps') === 'present') pltLines.push('  혈소판 응집: 있음')
    if (pltLines.length) { lines.push('\n▸ 혈소판 평가'); pltLines.forEach((l) => lines.push(l)) }
    const reticResult = computeReticulocyte(findings)
    if (reticResult) {
      lines.push('\n▸ 세망적혈구 (Reticulocyte)')
      if (reticResult.species === 'dog') {
        lines.push(`  ${reticResult.regenLabel}`)
        lines.push(`  Retic %: ${reticResult.reticPct}%, 교정 Retic: ${reticResult.corrected}%, RPI: ${reticResult.rpi}`)
      } else {
        lines.push(`  ${reticResult.regen ? '재생성 빈혈' : '비재생성 빈혈'}`)
        lines.push(`  응집형 Retic %: ${reticResult.aggPct}% (기준: >0.4%)`)
      }
    }
    const allHints = [...computeWbcHints(findings), ...computeRbcHints(findings), ...computePltHints(findings)]
    if (allHints.length > 0) {
      lines.push('\n▸ 해석 소견')
      allHints.forEach((h) => lines.push(`  [${h.severity === 'critical' ? '⚠ 중요' : h.severity === 'warning' ? '주의' : '참고'}] ${h.label}: ${h.detail}`))
    }
  }

  // Effusion fluid analysis section
  if (sampleType === 'effusion') {
    const sv = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
    const COLOR_L: Record<string, string> = { colorless: '무색', pale_yellow: '담황색', yellow: '황색', red: '혈성(적색)', pink: '혈성(분홍)', milky: '유백색(Chylous)', brown: '갈색/담즙성', green: '녹색' }
    const TURB_L: Record<string, string> = { clear: '맑음', slightly_turbid: '약간 혼탁', turbid: '혼탁', opaque: '불투명' }
    const fluidLines: string[] = []
    if (sv('fluid_color')) fluidLines.push(`  색깔: ${COLOR_L[sv('fluid_color')] ?? sv('fluid_color')}`)
    if (sv('fluid_turbidity')) fluidLines.push(`  혼탁도: ${TURB_L[sv('fluid_turbidity')] ?? sv('fluid_turbidity')}`)
    if (sv('fluid_protein')) fluidLines.push(`  총단백: ${sv('fluid_protein')} g/dL`)
    if (sv('fluid_tncc')) fluidLines.push(`  TNCC: ${sv('fluid_tncc')} /μL`)
    if (sv('fluid_specific_gravity')) fluidLines.push(`  비중: ${sv('fluid_specific_gravity')}`)
    if (sv('fluid_bun') && sv('serum_bun')) fluidLines.push(`  BUN: 체강액 ${sv('fluid_bun')} / 혈청 ${sv('serum_bun')} mg/dL`)
    if (sv('fluid_tbil') && sv('serum_tbil')) fluidLines.push(`  TBIL: 체강액 ${sv('fluid_tbil')} / 혈청 ${sv('serum_tbil')} mg/dL`)
    if (sv('fluid_triglyceride') && sv('serum_triglyceride')) fluidLines.push(`  TG: 체강액 ${sv('fluid_triglyceride')} / 혈청 ${sv('serum_triglyceride')} mg/dL`)
    if (sv('fluid_albumin') && sv('serum_albumin')) fluidLines.push(`  Albumin: 체강액 ${sv('fluid_albumin')} / 혈청 ${sv('serum_albumin')} g/dL`)
    if (fluidLines.length) { lines.push('\n▸ 체강액 분석'); fluidLines.forEach((l) => lines.push(l)) }
    const fluidHints = computeFluidHints(findings)
    if (fluidHints.length > 0) {
      lines.push('\n▸ 체강액 해석 소견')
      fluidHints.forEach((h) => lines.push(`  [${h.severity === 'critical' ? '⚠ 중요' : h.severity === 'warning' ? '주의' : '참고'}] ${h.label}: ${h.detail}`))
    }
  }

  if (engineOutput) {
    lines.push('')
    lines.push('[판독 결론]')
    lines.push(cytologyReference.buildSummary(findings, sampleType, engineOutput))

    if (engineOutput.diagnoses.length > 0) {
      lines.push('')
      lines.push('[진단]')
      engineOutput.diagnoses.slice(0, 3).forEach((d, i) => {
        lines.push(`${i === 0 ? '주진단' : `감별 ${i}`}: ${d.rule.nameKo} (신뢰도 ${d.confidenceScore}%)`)
        if (d.rule.descriptionKo) lines.push(`  → ${d.rule.descriptionKo}`)
      })
      const topDx = engineOutput.diagnoses[0]
      if (topDx.rule.treatmentHintKo) { lines.push(''); lines.push('[치료 방향]'); lines.push(topDx.rule.treatmentHintKo) }
      if (topDx.rule.additionalTestsKo?.length) {
        lines.push('')
        lines.push('[추가 검사 권장]')
        topDx.rule.additionalTestsKo.forEach((t) => lines.push(`  - ${t}`))
      }
    }

    if (engineOutput.criticalFindings.length > 0) {
      lines.push('')
      lines.push('[중요 소견]')
      engineOutput.criticalFindings.forEach((f) => lines.push(f))
    }
  }

  if (aiSummary) {
    lines.push('')
    lines.push('[최종 임상 소견]')
    lines.push(aiSummary)
  }

  lines.push('')
  lines.push('──────────────────────────────────────')
  lines.push('본 보고서는 수의사의 임상 판단 하에 최종 진단하여야 합니다.')
  lines.push('══════════════════════════════════════')

  return lines.join('\n')
}

// ── Visual report sub-components ──────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wide w-16">{label}</span>
      <span className="text-xs text-slate-800 font-medium">{value || '-'}</span>
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-violet-100 pb-1 mb-2">
      <span className="text-[11px] font-black text-violet-700 uppercase tracking-widest">{title}</span>
      {sub && <span className="text-[9px] font-bold text-slate-400">{sub}</span>}
    </div>
  )
}

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : score >= 40 ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${color}`}>
      {score}%
    </span>
  )
}

// ── Visual report body (captured for export) ──────────────────

interface ReportBodyProps {
  chartDetail: CytologyChartDetail
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  engineOutput: CytologyEngineOutput | null
  aiSummary?: string | null
}

function VisualReportBody({ chartDetail, sampleType, findings, engineOutput, aiSummary }: ReportBodyProps) {
  const patient = chartDetail.patient
  const now = new Date().toLocaleDateString('ko-KR')
  const sampleDef = cytologyReference.getSampleDef(sampleType)
  const summary = engineOutput ? cytologyReference.buildSummary(findings, sampleType, engineOutput) : null
  const topDx = engineOutput?.diagnoses[0] ?? null
  const malignancyCount = ['malig_criteria_1','malig_criteria_2','malig_criteria_3','malig_criteria_4','malig_criteria_5']
    .filter((id) => findings[id] === 'true').length

  // Clinical info fields
  const massLocation = findings['mass_location'] as string | undefined
  const massSize = findings['mass_size'] as string | undefined
  const clinicalContext = findings['clinical_context'] as string | undefined
  const stainMethod = findings['stain_method'] as string | undefined
  const hasClinical = massLocation || massSize || clinicalContext

  // Routine findings
  const routineFindings: { sectionLabel: string; items: { label: string; value: string; isAbnormal: boolean }[] }[] = []
  if (sampleDef) {
    for (const section of sampleDef.sections) {
      const items = section.tests
        .filter((t) => {
          const v = findings[t.testId]
          return v !== undefined && v !== '' && v !== 'none' && v !== 'absent' && v !== 'normal'
        })
        .map((t) => {
          const val = findings[t.testId]
          const opt = t.options?.find((o) => o.value === (Array.isArray(val) ? val[0] : val))
          return {
            label: t.label,
            value: opt?.label ?? String(Array.isArray(val) ? val.join(', ') : val),
            isAbnormal: opt?.isAbnormal ?? false,
          }
        })
      if (items.length > 0) routineFindings.push({ sectionLabel: section.label, items })
    }
  }

  // Specialist: identified cells
  const identifiedRaw = findings['identified_cells']
  const identifiedCells: string[] = Array.isArray(identifiedRaw) ? identifiedRaw : identifiedRaw ? [identifiedRaw as string] : []

  // Inflammation
  const INFL_LABELS: Record<string, string> = {
    neutrophilic_pure: '호중구성 (비패혈성)', neutrophilic_septic: '호중구성 (패혈성)',
    macrophagic: '대식세포성', eosinophilic: '호산구성', lymphocytic: '림프구성', mixed: '혼합성',
  }
  const inflType = findings['infl_type'] as string | undefined
  const MALIG_LABELS = [
    ['malig_criteria_1', '세포 크기 다형성', 'Anisocytosis'],
    ['malig_criteria_2', '핵 크기 다형성', 'Anisokaryosis'],
    ['malig_criteria_3', '다형성 핵소체', 'Prominent nucleoli'],
    ['malig_criteria_4', '유사분열상', 'Mitotic figures'],
    ['malig_criteria_5', '핵 이형성', 'Nuclear molding'],
  ]

  return (
    <div className="bg-white text-slate-900 font-sans" style={{ width: '100%', fontSize: 12 }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b-2 border-violet-600 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg shrink-0">
            <Microscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">세포학 검사 판독 보고서</h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Cytology Examination Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Report Date</p>
          <p className="text-xs font-semibold text-slate-700">{now}</p>
        </div>
      </div>

      {/* ── Patient & Exam Info ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <SectionHeader title="환자 정보" sub="Patient Info" />
          <InfoRow label="이름" value={patient?.name ?? '-'} />
          <InfoRow label="종/품종" value={patient ? `${patient.species === 'cat' ? '고양이' : '개'} / ${patient.breed}` : '-'} />
          <InfoRow label="성별" value={patient?.gender ?? '-'} />
          <InfoRow label="나이" value={patient?.birth ? calcAge(patient.birth) : '-'} />
          <InfoRow label="보호자" value={patient?.owner_name ?? '-'} />
          <InfoRow label="차트번호" value={patient?.hos_patient_id ?? '-'} />
        </div>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <SectionHeader title="검사 정보" sub="Exam Info" />
          <InfoRow label="검체" value={SAMPLE_LABELS[sampleType]} />
          <InfoRow label="검사일" value={chartDetail.chart_date ?? '-'} />
          <InfoRow label="염색법" value={stainMethod ?? sampleDef?.stainMethods.join(', ') ?? '-'} />
          <InfoRow label="판독의" value={chartDetail.evaluator?.name ?? '-'} />
        </div>
      </div>

      {/* ── Clinical Info ───────────────────────────────────── */}
      {hasClinical && (
        <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 p-3">
          <SectionHeader title="임상 소견" sub="Clinical Findings" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {massLocation && <InfoRow label="위치" value={massLocation} />}
            {massSize && <InfoRow label="크기" value={massSize} />}
            {clinicalContext && (
              <div className="col-span-2">
                <InfoRow label="상황" value={clinicalContext} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 체강액 분석 (effusion only) ─────────────────────────── */}
      {sampleType === 'effusion' && (() => {
        const fv = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
        const colorLabel: Record<string, string> = { colorless: '무색', pale_yellow: '담황색', yellow: '황색', red: '혈성(적색)', pink: '혈성(분홍)', milky: '유백색(Chylous)', brown: '갈색/담즙성', green: '녹색' }
        const turbLabel: Record<string, string> = { clear: '맑음', slightly_turbid: '약간 혼탁', turbid: '혼탁', opaque: '불투명' }
        const HINT_COLOR: Record<string, string> = { info: 'border-blue-200 bg-blue-50 text-blue-800', warning: 'border-amber-300 bg-amber-50 text-amber-800', critical: 'border-rose-300 bg-rose-50 text-rose-800' }
        const HINT_DOT_C: Record<string, string> = { info: 'bg-blue-400', warning: 'bg-amber-400', critical: 'bg-rose-500' }
        const rows: { label: string; value: string }[] = []
        if (fv('fluid_color')) rows.push({ label: '색깔', value: colorLabel[fv('fluid_color')] ?? fv('fluid_color') })
        if (fv('fluid_turbidity')) rows.push({ label: '혼탁도', value: turbLabel[fv('fluid_turbidity')] ?? fv('fluid_turbidity') })
        if (fv('fluid_protein')) rows.push({ label: '총단백', value: `${fv('fluid_protein')} g/dL` })
        if (fv('fluid_tncc')) rows.push({ label: 'TNCC', value: `${fv('fluid_tncc')} /μL` })
        if (fv('fluid_specific_gravity')) rows.push({ label: '비중', value: fv('fluid_specific_gravity') })
        if (fv('fluid_bun') && fv('serum_bun')) rows.push({ label: 'BUN (체강/혈청)', value: `${fv('fluid_bun')} / ${fv('serum_bun')} mg/dL` })
        if (fv('fluid_tbil') && fv('serum_tbil')) rows.push({ label: 'TBIL (체강/혈청)', value: `${fv('fluid_tbil')} / ${fv('serum_tbil')} mg/dL` })
        if (fv('fluid_triglyceride') && fv('serum_triglyceride')) rows.push({ label: 'TG (체강/혈청)', value: `${fv('fluid_triglyceride')} / ${fv('serum_triglyceride')} mg/dL` })
        if (fv('fluid_albumin') && fv('serum_albumin')) rows.push({ label: 'Albumin (체강/혈청)', value: `${fv('fluid_albumin')} / ${fv('serum_albumin')} g/dL` })
        const hints = computeFluidHints(findings)
        if (rows.length === 0 && hints.length === 0) return null
        return (
          <div className="mb-4 rounded-lg border border-cyan-100 bg-cyan-50 p-3">
            <SectionHeader title="체강액 분석" sub="Fluid Analysis" />
            {rows.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 mb-3">
                {rows.map((r) => <InfoRow key={r.label} label={r.label} value={r.value} />)}
              </div>
            )}
            {hints.length > 0 && (
              <div className="space-y-1.5 mt-2">
                <p className="text-[9px] font-black text-cyan-700 uppercase tracking-widest">해석 소견</p>
                {hints.map((h, i) => (
                  <div key={i} className={`rounded border px-2 py-1.5 ${HINT_COLOR[h.severity]}`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${HINT_DOT_C[h.severity]}`} />
                      <span className="text-[9px] font-bold">{h.label}</span>
                    </div>
                    <p className="text-[9px] leading-snug pl-2.5 opacity-90">{h.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── 혈액도말 분석 (blood_smear only) ──────────────────────── */}
      {sampleType === 'blood_smear' && (() => {
        const fv = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
        const nv = (id: string) => { const v = findings[id]; const n = parseFloat(Array.isArray(v) ? v[0] : (v ?? '')); return isNaN(n) ? null : n }
        const HINT_COLOR: Record<string, string> = { info: 'border-blue-200 bg-blue-50 text-blue-800', warning: 'border-amber-300 bg-amber-50 text-amber-800', critical: 'border-rose-300 bg-rose-50 text-rose-800' }
        const HINT_DOT_C: Record<string, string> = { info: 'bg-blue-400', warning: 'bg-amber-400', critical: 'bg-rose-500' }

        const dcRows = DC_FIELDS.map((f) => ({ ...f, val: nv(f.id) })).filter((f) => f.val !== null && f.val! > 0).sort((a, b) => (b.val ?? 0) - (a.val ?? 0))
        const wbcHints = computeWbcHints(findings)
        const rbcHints = computeRbcHints(findings)
        const pltHints = computePltHints(findings)
        const allHints = [...wbcHints, ...rbcHints, ...pltHints]
        const reticResult = computeReticulocyte(findings)
        const TOXIC_LABELS: Record<string, string> = { none: '없음', rare: '소수', few: '적음', moderate: '중등도', many: '다수' }
        const GRADE_L: Record<string, string> = { none: '없음', mild: '경도', moderate: '중등도', marked: '현저' }
        const PLT_EST: Record<string, string> = { adequate: '정상', decreased: '감소', increased: '증가', cannot_estimate: '평가 불가' }
        const pltEst = fv('plt_estimate')
        const pltHpf = nv('plt_per_hpf')
        const poikiArr = Array.isArray(findings['rbc_poikilocytes']) ? findings['rbc_poikilocytes'] as string[] : []
        const hasBs = dcRows.length > 0 || allHints.length > 0 || reticResult || pltEst
        if (!hasBs) return null
        return (
          <div className="mb-4 space-y-3">
            {/* DC */}
            {dcRows.length > 0 && (
              <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                <SectionHeader title="감별 백혈구 계수 (DC)" sub="Differential Count" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                  {dcRows.map((f) => (
                    <div key={f.id} className="flex gap-1 items-baseline">
                      <span className="text-[10px] text-slate-500 shrink-0">{f.label}:</span>
                      <span className={`text-[10px] font-semibold ${f.id === 'dc_blast' || f.id === 'dc_atyp_lymph' ? 'text-rose-700' : f.id === 'dc_band' || f.id === 'dc_meta' ? 'text-amber-700' : 'text-slate-800'}`}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toxic changes + RBC morphology */}
            {(() => {
              const toxicItems: string[] = []
              if (fv('wbc_dohle') && fv('wbc_dohle') !== 'none') toxicItems.push(`Döhle bodies: ${TOXIC_LABELS[fv('wbc_dohle')] ?? fv('wbc_dohle')}`)
              if (fv('wbc_toxic_gran') && fv('wbc_toxic_gran') !== 'none') toxicItems.push(`독성 과립: ${TOXIC_LABELS[fv('wbc_toxic_gran')] ?? fv('wbc_toxic_gran')}`)
              if (fv('wbc_vacuolation') && fv('wbc_vacuolation') !== 'none') toxicItems.push(`세포질 공포화: ${TOXIC_LABELS[fv('wbc_vacuolation')] ?? fv('wbc_vacuolation')}`)
              const rbcItems: string[] = []
              if (fv('rbc_anisocytosis') && fv('rbc_anisocytosis') !== 'none') rbcItems.push(`다양크기증: ${GRADE_L[fv('rbc_anisocytosis')] ?? fv('rbc_anisocytosis')}`)
              if (fv('rbc_polychromasia') && fv('rbc_polychromasia') !== 'none') rbcItems.push(`다색성: ${GRADE_L[fv('rbc_polychromasia')] ?? fv('rbc_polychromasia')}`)
              if (fv('rbc_hypochromia') && fv('rbc_hypochromia') !== 'none') rbcItems.push(`저색소증: ${GRADE_L[fv('rbc_hypochromia')] ?? fv('rbc_hypochromia')}`)
              if (fv('rbc_autoagglutination') === 'present') rbcItems.push('자가응집: 있음')
              if (poikiArr.length > 0) rbcItems.push(`형태 이상: ${poikiArr.join(', ')}`)
              const parasites = fv('rbc_parasites')
              if (parasites && parasites !== 'none') rbcItems.push(`RBC 기생충: ${parasites}`)
              if (toxicItems.length === 0 && rbcItems.length === 0) return null
              return (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <SectionHeader title="형태학적 소견" sub="Morphology" />
                  {toxicItems.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">독성변화</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {toxicItems.map((t) => <span key={t} className="text-[10px] text-slate-700">{t}</span>)}
                      </div>
                    </div>
                  )}
                  {rbcItems.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">적혈구 형태</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {rbcItems.map((r) => <span key={r} className="text-[10px] text-slate-700">{r}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* PLT */}
            {(pltEst || pltHpf !== null) && (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <SectionHeader title="혈소판 평가" sub="Platelet" />
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {pltEst && <span className="text-[10px] text-slate-700">추정: <span className={`font-semibold ${pltEst === 'decreased' ? 'text-rose-700' : pltEst === 'increased' ? 'text-amber-700' : ''}`}>{PLT_EST[pltEst] ?? pltEst}</span></span>}
                  {pltHpf !== null && <span className="text-[10px] text-slate-700">추정 수: <span className="font-semibold">{Math.round(pltHpf * 15000).toLocaleString()}/μL</span></span>}
                </div>
              </div>
            )}

            {/* Reticulocyte */}
            {reticResult && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                <SectionHeader title="세망적혈구" sub="Reticulocyte" />
                <p className="text-[11px] font-bold text-violet-800 mb-0.5">
                  {reticResult.species === 'dog' ? reticResult.regenLabel : (reticResult.regen ? '재생성 빈혈' : '비재생성 빈혈')}
                </p>
                {reticResult.species === 'dog' ? (
                  <p className="text-[10px] text-violet-700">Retic {reticResult.reticPct}% → 교정 {reticResult.corrected}% → RPI {reticResult.rpi}</p>
                ) : (
                  <p className="text-[10px] text-violet-700">응집형 Retic {reticResult.aggPct}% (기준: &gt;0.4%)</p>
                )}
              </div>
            )}

            {/* Hints */}
            {allHints.length > 0 && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <SectionHeader title="해석 소견" sub="Interpretation" />
                <div className="space-y-1.5">
                  {allHints.map((h, i) => (
                    <div key={i} className={`rounded border px-2 py-1.5 ${HINT_COLOR[h.severity]}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${HINT_DOT_C[h.severity]}`} />
                        <span className="text-[9px] font-bold">{h.label}</span>
                      </div>
                      <p className="text-[9px] leading-snug pl-2.5 opacity-90">{h.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Cytological Findings ────────────────────────────── */}
      <div className="mb-4">
        <SectionHeader title="세포학적 소견" sub="Cytological Findings" />

        {/* Routine */}
        {routineFindings.length > 0 && routineFindings.map((sec) => (
          <div key={sec.sectionLabel} className="mb-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{sec.sectionLabel}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {sec.items.map((item) => (
                <div key={item.label} className="flex gap-1 items-baseline">
                  <span className="text-[10px] text-slate-500 shrink-0">{item.label}:</span>
                  <span className={`text-[10px] font-semibold ${item.isAbnormal ? 'text-rose-700' : 'text-slate-800'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Specialist: quality */}
        {!sampleDef && (() => {
          const QUALITY = [
            { id: 'sq_cellularity', label: '세포충실성', vals: { low: '낮음', moderate: '중등도', high: '높음' } },
            { id: 'sq_hemodilution', label: '혈액 희석', vals: { none: '없음', mild: '경도', moderate: '중등도', severe: '심함' } },
            { id: 'sq_necrosis', label: '괴사', vals: { none: '없음', present: '있음' } },
          ]
          const qItems = QUALITY.filter(({ id }) => findings[id] && findings[id] !== 'none')
          if (!qItems.length) return null
          return (
            <div className="mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">검체 품질</p>
              <div className="flex flex-wrap gap-2">
                {qItems.map(({ id, label, vals }) => (
                  <span key={id} className="text-[10px] text-slate-700">
                    {label}: <span className="font-semibold">{(vals as any)[findings[id] as string] ?? findings[id]}</span>
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Specialist: inflammation */}
        {!sampleDef && (inflType && inflType !== 'none') && (
          <div className="mb-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">염증 평가</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-700">
              <span>유형: <span className="font-semibold">{INFL_LABELS[inflType] ?? inflType}</span></span>
              {findings['infl_degenerate_neutrophils'] === 'true' && <span className="text-rose-700 font-semibold">변성 호중구 ✓</span>}
              {findings['infl_giant_cells'] === 'true' && <span className="text-rose-700 font-semibold">다핵 거대세포 ✓</span>}
              {findings['infl_plasma_cells'] === 'true' && <span className="font-semibold">형질세포 ✓</span>}
            </div>
          </div>
        )}

        {/* Specialist: cells */}
        {!sampleDef && identifiedCells.length > 0 && (
          <div className="mb-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">세포 분류</p>
            <div className="space-y-1.5">
              {cytologyReference.cellTypes
                .filter((c) => identifiedCells.includes(c.cellId))
                .map((cellDef) => {
                  const morphItems = cellDef.morphTests
                    .map((mt) => {
                      const v = findings[mt.testId]
                      if (!v || v === '' || v === 'none' || v === 'false') return null
                      const opt = mt.options?.find((o) => o.value === v)
                      return { label: mt.label, value: opt?.label ?? String(v) }
                    })
                    .filter(Boolean) as { label: string; value: string }[]
                  return (
                    <div key={cellDef.cellId} className="rounded border border-violet-100 bg-violet-50 px-2 py-1.5">
                      <p className="text-[10px] font-black text-violet-800 mb-0.5">{cellDef.nameKo} <span className="font-normal text-violet-500 italic">{cellDef.nameEn}</span></p>
                      {morphItems.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          {morphItems.map((m) => (
                            <span key={m.label} className="text-[9px] text-slate-600">{m.label}: <span className="font-semibold text-slate-800">{m.value}</span></span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Specialist: malignancy */}
        {!sampleDef && malignancyCount > 0 && (
          <div className="mb-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              악성도 기준 <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-black ${malignancyCount >= 4 ? 'bg-red-100 text-red-700' : malignancyCount >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{malignancyCount}/5</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MALIG_LABELS.filter(([id]) => findings[id] === 'true').map(([, ko, en]) => (
                <span key={ko} className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">✓ {ko} ({en})</span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(findings).length === 0 && (
          <p className="text-xs text-slate-400 italic">(소견 없음)</p>
        )}
      </div>

      {/* ── Diagnosis ──────────────────────────────────────── */}
      {engineOutput && engineOutput.diagnoses.length > 0 && (
        <div className="mb-4">
          <SectionHeader title="판독 결론" sub="Diagnosis" />

          {/* Summary */}
          {summary && (
            <p className="text-[11px] text-slate-700 leading-relaxed mb-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              {summary}
            </p>
          )}

          {/* Top diagnosis */}
          <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-3 mb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">주진단</span>
                <p className="text-sm font-black text-violet-900 leading-snug">{topDx!.rule.nameKo}</p>
                {topDx!.rule.nameEn && <p className="text-[10px] text-violet-600 italic">{topDx!.rule.nameEn}</p>}
              </div>
              <ConfidenceBadge score={topDx!.confidenceScore} />
            </div>
            {topDx!.rule.descriptionKo && (
              <p className="mt-1.5 text-[10px] text-violet-800 leading-relaxed">{topDx!.rule.descriptionKo}</p>
            )}
          </div>

          {/* Differentials */}
          {engineOutput.diagnoses.length > 1 && (
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">감별 진단</p>
              {engineOutput.diagnoses.slice(1, 4).map((d) => (
                <div key={d.rule.diagnosisId} className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5">
                  <span className="text-[11px] font-semibold text-slate-700">{d.rule.nameKo}</span>
                  <ConfidenceBadge score={d.confidenceScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Treatment & Additional tests ───────────────────── */}
      {topDx?.rule.treatmentHintKo && (
        <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <SectionHeader title="치료 방향" sub="Treatment Hint" />
          <p className="text-[10px] text-emerald-900 leading-relaxed">{topDx.rule.treatmentHintKo}</p>
        </div>
      )}

      {topDx?.rule.additionalTestsKo && topDx.rule.additionalTestsKo.length > 0 && (
        <div className="mb-3 rounded-lg border border-sky-100 bg-sky-50 p-3">
          <SectionHeader title="추가 검사 권장" sub="Additional Tests" />
          <ul className="space-y-0.5">
            {topDx.rule.additionalTestsKo.map((t) => (
              <li key={t} className="text-[10px] text-sky-900 flex gap-1.5">
                <span className="text-sky-500 shrink-0">·</span>{t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Critical findings ──────────────────────────────── */}
      {engineOutput && engineOutput.criticalFindings.length > 0 && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <SectionHeader title="⚠ 중요 소견" sub="Critical Findings" />
          {engineOutput.criticalFindings.map((f) => (
            <p key={f} className="text-[10px] font-semibold text-rose-800">{f}</p>
          ))}
        </div>
      )}

      {/* ── 최종 임상 소견 ─────────────────────────────────── */}
      {aiSummary && (
        <div className="mb-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
          <SectionHeader title="최종 임상 소견" sub="Clinical Impression" />
          <p className="text-[10px] text-slate-800 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="mt-4 border-t border-slate-200 pt-2.5 text-center">
        <p className="text-[9px] text-slate-400 leading-relaxed">
          본 보고서는 수의사의 임상 판단 하에 최종 진단하여야 합니다.<br />
          This report should be interpreted in conjunction with clinical findings by a licensed veterinarian.
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function CytologyReportDialog({
  chartDetail,
  activeSamples,
  samplesData,
  engineOutputs,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)

  const handleExportPng = async () => {
    if (!printRef.current) return
    setExporting('png')
    try {
      const canvas = await captureElement(printRef.current)
      const link = document.createElement('a')
      link.download = buildFilename(chartDetail, activeSamples, 'png')
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    if (!printRef.current) return
    setExporting('pdf')
    try {
      const canvas = await captureElement(printRef.current)
      const { jsPDF } = await import('jspdf')
      const imgW = canvas.width
      const imgH = canvas.height
      const pageW = 210
      const pageH = 297
      const margin = 10
      const contentW = pageW - margin * 2
      const contentH = (imgH * contentW) / imgW

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageContentH = pageH - margin * 2
      let yOffset = 0

      while (yOffset < contentH) {
        if (yOffset > 0) pdf.addPage()
        const srcY = (yOffset / contentH) * imgH
        const srcH = Math.min((pageContentH / contentH) * imgH, imgH - srcY)
        const renderH = (srcH / imgH) * contentH
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgW
        pageCanvas.height = srcH
        const ctx = pageCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH)
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentW, renderH)
        yOffset += pageContentH
      }

      pdf.save(buildFilename(chartDetail, activeSamples, 'pdf'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <FileText className="h-4 w-4" />
          보고서
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b bg-slate-50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-violet-600" />
            세포학 판독 보고서
            {activeSamples.length > 1 && (
              <span className="text-xs font-normal text-slate-500">({activeSamples.length}개 검체)</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Report preview */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div ref={printRef} className="bg-white rounded-lg shadow-sm p-6 mx-auto" style={{ maxWidth: 680 }}>
            {activeSamples.map((sampleType, i) => (
              <div key={sampleType}>
                {i > 0 && (
                  <div className="my-6 relative border-t-2 border-dashed border-slate-300">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      다음 검체
                    </span>
                  </div>
                )}
                <VisualReportBody
                  chartDetail={chartDetail}
                  sampleType={sampleType}
                  findings={samplesData[sampleType]?.findings ?? {}}
                  engineOutput={engineOutputs[sampleType] ?? null}
                  aiSummary={samplesData[sampleType]?.impression || null}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t bg-slate-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            disabled={exporting !== null}
            className="gap-1.5 text-xs"
          >
            {exporting === 'png'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <ImageIcon className="h-3.5 w-3.5" />}
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting !== null}
            className="gap-1.5 text-xs"
          >
            {exporting === 'pdf'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FileDown className="h-3.5 w-3.5" />}
            PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

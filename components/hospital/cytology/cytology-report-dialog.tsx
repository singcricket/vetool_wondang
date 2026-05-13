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
import type { CytologyEngineOutput, CytologySampleType } from '@/constants/hospital/cytology/cytology-types'
import { cytologyReference } from '@/constants/hospital/cytology/cytology_ref'

export const SAMPLE_LABELS: Record<CytologySampleType, string> = {
  otic: '귀도말 (Otic Swab)',
  skin_impression: '피부 인상도말 (Skin Impression)',
  skin_exudate: '피부 삼출물 도말 (Skin Exudate)',
  fecal: '분변염색 (Fecal Cytology)',
  vaginal: '질 세포진 (Vaginal Cytology)',
  conjunctival: '결막/각막 도말 (Conjunctival)',
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
  sampleType: CytologySampleType
  findings: Record<string, string | string[]>
  engineOutput: CytologyEngineOutput | null
  aiSummary?: string | null
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

function buildFilename(chartDetail: CytologyChartDetail, sampleType: CytologySampleType, ext: string): string {
  const name = chartDetail.patient?.name ?? 'report'
  const date = chartDetail.chart_date ?? new Date().toISOString().slice(0, 10)
  const sample = sampleType.replace('_', '-')
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
    lines.push('[AI 보조 판독]')
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
  const evaluatorComment = findings['evaluator_comment'] as string | undefined
  const stainMethod = findings['stain_method'] as string | undefined
  const hasClinical = massLocation || massSize || clinicalContext || evaluatorComment

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
            {evaluatorComment && (
              <div className="col-span-2">
                <InfoRow label="소견" value={evaluatorComment} />
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* ── AI Summary ─────────────────────────────────────── */}
      {aiSummary && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <SectionHeader title="AI 보조 판독" sub="AI-Assisted Interpretation" />
          <p className="text-[10px] text-amber-900 leading-relaxed">{aiSummary}</p>
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
  sampleType,
  findings,
  engineOutput,
  aiSummary,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)

  const handleExportPng = async () => {
    if (!printRef.current) return
    setExporting('png')
    try {
      const canvas = await captureElement(printRef.current)
      const link = document.createElement('a')
      link.download = buildFilename(chartDetail, sampleType, 'png')
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
      const imgData = canvas.toDataURL('image/png')
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

      pdf.save(buildFilename(chartDetail, sampleType, 'pdf'))
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
          </DialogTitle>
        </DialogHeader>

        {/* Report preview */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div ref={printRef} className="bg-white rounded-lg shadow-sm p-6 mx-auto" style={{ maxWidth: 680 }}>
            <VisualReportBody
              chartDetail={chartDetail}
              sampleType={sampleType}
              findings={findings}
              engineOutput={engineOutput}
              aiSummary={aiSummary}
            />
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

'use client'

import React from 'react'
import { Microscope, AlertTriangle, FlaskConical, ShieldAlert, Droplets, Activity } from 'lucide-react'
import type {
  CytologyEngineOutput,
  CytologySampleType,
} from '@/constants/hospital/cytology/cytology-types'
import {
  computeFluidHints,
  computeWbcHints,
  computeRbcHints,
  computePltHints,
  computeReticulocyte,
  DC_FIELDS,
} from '@/constants/hospital/cytology/cytology-hints'

interface Props {
  engineOutput: CytologyEngineOutput | null
  sampleType: CytologySampleType
  findings?: Record<string, string | string[]>
}

const HINT_STYLE: Record<string, string> = {
  info:     'border-blue-200 bg-blue-50 text-blue-800',
  warning:  'border-amber-300 bg-amber-50 text-amber-800',
  critical: 'border-rose-300 bg-rose-50 text-rose-800',
}
const HINT_DOT: Record<string, string> = { info: 'bg-blue-400', warning: 'bg-amber-400', critical: 'bg-rose-500' }

function HintList({ hints }: { hints: { label: string; detail: string; severity: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {hints.map((h, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2 ${HINT_STYLE[h.severity]}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`h-2 w-2 rounded-full shrink-0 ${HINT_DOT[h.severity]}`} />
            <span className="text-xs font-semibold leading-snug">{h.label}</span>
          </div>
          <p className="text-[10px] leading-relaxed pl-3.5 opacity-90">{h.detail}</p>
        </div>
      ))}
    </div>
  )
}

// ── Blood Smear panel ─────────────────────────────────────────

function BloodSmearPanel({ findings }: { findings: Record<string, string | string[]> }) {
  const sv = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
  const nv = (id: string) => { const v = findings[id]; const n = parseFloat(Array.isArray(v) ? v[0] : (v ?? '')); return isNaN(n) ? null : n }

  const wbcHints = computeWbcHints(findings)
  const rbcHints = computeRbcHints(findings)
  const pltHints = computePltHints(findings)
  const allHints = [...wbcHints, ...rbcHints, ...pltHints]
  const criticalHints = allHints.filter((h) => h.severity === 'critical')
  const otherHints = allHints.filter((h) => h.severity !== 'critical')

  const reticResult = computeReticulocyte(findings)

  // DC summary — only cells with value
  const dcRows = DC_FIELDS
    .map((f) => ({ ...f, val: nv(f.id) }))
    .filter((f) => f.val !== null && f.val! > 0)
    .sort((a, b) => (b.val ?? 0) - (a.val ?? 0))

  const PLT_ESTIMATE_LABELS: Record<string, string> = {
    adequate: '정상', decreased: '감소', increased: '증가', cannot_estimate: '평가 불가',
  }
  const pltEstimate = sv('plt_estimate')
  const pltHpf = nv('plt_per_hpf')

  const hasAnyData = dcRows.length > 0 || allHints.length > 0 || reticResult

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-white rounded-lg border">
        <Activity className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-semibold text-slate-500">소견 입력 시 자동 분석됩니다</p>
        <p className="text-xs mt-1 text-slate-400">DC, 독성변화, RBC/PLT 소견을 입력하세요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Critical findings first */}
      {criticalHints.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            중요 소견
          </h3>
          <HintList hints={criticalHints} />
        </section>
      )}

      {/* DC summary */}
      {dcRows.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Microscope className="w-3.5 h-3.5" />
            감별 백혈구 (DC)
          </h3>
          <div className="rounded-lg border bg-white p-2 space-y-1">
            {dcRows.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 w-28 shrink-0">{f.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      f.id === 'dc_blast' || f.id === 'dc_atyp_lymph' ? 'bg-rose-500' :
                      f.id === 'dc_band' || f.id === 'dc_meta' ? 'bg-amber-500' :
                      'bg-violet-400'
                    }`}
                    style={{ width: `${Math.min(f.val!, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 w-9 text-right shrink-0">{f.val}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PLT summary */}
      {(pltEstimate || pltHpf !== null) && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            혈소판
          </h3>
          <div className="rounded-lg border bg-white p-2 text-xs text-slate-700 space-y-0.5">
            {pltEstimate && <p>추정 개수: <span className={`font-semibold ${pltEstimate === 'decreased' ? 'text-rose-700' : pltEstimate === 'increased' ? 'text-amber-700' : 'text-slate-800'}`}>{PLT_ESTIMATE_LABELS[pltEstimate] ?? pltEstimate}</span></p>}
            {pltHpf !== null && <p>추정: <span className="font-semibold">{(Math.round(pltHpf * 15000)).toLocaleString()}/μL</span></p>}
          </div>
        </section>
      )}

      {/* Reticulocyte result */}
      {reticResult && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">세망적혈구</h3>
          <div className={`rounded-lg border px-3 py-2 text-xs ${
            reticResult.species === 'dog'
              ? reticResult.regenSev === 'critical' ? 'border-rose-300 bg-rose-50 text-rose-800'
                : reticResult.regenSev === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
              : reticResult.regen ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-rose-300 bg-rose-50 text-rose-800'
          }`}>
            <p className="font-semibold text-sm mb-1">
              {reticResult.species === 'dog' ? reticResult.regenLabel : (reticResult.regen ? '재생성 빈혈' : '비재생성 빈혈')}
            </p>
            {reticResult.species === 'dog' ? (
              <p>RPI: {reticResult.rpi} (교정 Retic {reticResult.corrected}%)</p>
            ) : (
              <p>응집형 Retic: {reticResult.aggPct}% (기준 &gt;0.4%)</p>
            )}
          </div>
        </section>
      )}

      {/* Other hints */}
      {otherHints.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">참고 소견</h3>
          <HintList hints={otherHints} />
        </section>
      )}
    </div>
  )
}

// ── Effusion panel ────────────────────────────────────────────

function EffusionPanel({ findings }: { findings: Record<string, string | string[]> }) {
  const sv = (id: string) => (Array.isArray(findings[id]) ? (findings[id] as string[])[0] : (findings[id] as string)) ?? ''
  const hints = computeFluidHints(findings)

  const COLOR_LABELS: Record<string, string> = {
    colorless: '무색', pale_yellow: '담황색', yellow: '황색', red: '혈성(적색)',
    pink: '혈성(분홍)', milky: '유백색(Chylous)', brown: '갈색/담즙성', green: '녹색',
  }
  const TURB_LABELS: Record<string, string> = {
    clear: '맑음', slightly_turbid: '약간 혼탁', turbid: '혼탁', opaque: '불투명',
  }

  const color = sv('fluid_color'); const turb = sv('fluid_turbidity')
  const protein = sv('fluid_protein'); const tncc = sv('fluid_tncc')
  const hasBasic = color || turb || protein || tncc

  if (!hasBasic && hints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-white rounded-lg border">
        <Droplets className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-semibold text-slate-500">체강액 수치를 입력하세요</p>
        <p className="text-xs mt-1 text-slate-400">체강액 분석 탭에서 값을 입력하면<br />자동 해석이 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Basic values */}
      {hasBasic && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5" />
            체강액 기본 수치
          </h3>
          <div className="rounded-lg border bg-white p-2.5 space-y-1 text-xs text-slate-700">
            {color && <div className="flex justify-between"><span className="text-slate-500">색깔</span><span className="font-medium">{COLOR_LABELS[color] ?? color}</span></div>}
            {turb && <div className="flex justify-between"><span className="text-slate-500">혼탁도</span><span className="font-medium">{TURB_LABELS[turb] ?? turb}</span></div>}
            {protein && <div className="flex justify-between"><span className="text-slate-500">총단백</span><span className="font-medium">{protein} g/dL</span></div>}
            {tncc && <div className="flex justify-between"><span className="text-slate-500">TNCC</span><span className="font-medium">{tncc} /μL</span></div>}
          </div>
        </section>
      )}

      {/* Hints */}
      {hints.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            해석 소견
          </h3>
          <HintList hints={hints} />
        </section>
      )}
    </div>
  )
}

// ── Standard engine-based panel ───────────────────────────────

const INFLAMMATION_LABEL: Record<
  NonNullable<CytologyEngineOutput['inflammationType']>,
  string
> = {
  neutrophilic: '호중구성',
  macrophagic: '대식세포성',
  eosinophilic: '호산구성',
  lymphocytic: '림프구성',
  mixed: '혼합성',
}

const INFLAMMATION_COLOR: Record<
  NonNullable<CytologyEngineOutput['inflammationType']>,
  string
> = {
  neutrophilic: 'bg-red-100 text-red-700 border-red-200',
  macrophagic: 'bg-orange-100 text-orange-700 border-orange-200',
  eosinophilic: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  lymphocytic: 'bg-blue-100 text-blue-700 border-blue-200',
  mixed: 'bg-purple-100 text-purple-700 border-purple-200',
}

const MALIGNANCY_CONFIG: Record<
  Exclude<NonNullable<CytologyEngineOutput['malignancySuspicion']>, 'none'>,
  { label: string; color: string }
> = {
  low: { label: '낮음', color: 'bg-green-100 text-green-700 border-green-200' },
  moderate: { label: '중간', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  high: { label: '높음', color: 'bg-red-100 text-red-700 border-red-200' },
}

const CATEGORY_LABEL: Record<string, string> = {
  inflammation: '염증',
  infection: '감염',
  neoplasia: '종양',
  hyperplasia: '과형성',
  cyst: '낭종',
  normal: '정상',
  hormonal: '호르몬성',
  parasitic: '기생충성',
  immune_mediated: '면역매개성',
}

// ── Main component ────────────────────────────────────────────

export default function CytologyDiagnosisPanel({ engineOutput, sampleType, findings = {} }: Props) {
  // Blood smear and effusion get dedicated panels
  if (sampleType === 'blood_smear') {
    return (
      <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 p-3">
        <BloodSmearPanel findings={findings} />
      </div>
    )
  }

  if (sampleType === 'effusion') {
    return (
      <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 p-3">
        <EffusionPanel findings={findings} />
        {/* Also show engine output if any diagnoses matched */}
        {engineOutput && engineOutput.diagnoses.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5" />
              세포학적 진단
            </h3>
            <div className="flex flex-col gap-2">
              {engineOutput.diagnoses.slice(0, 3).map((result, idx) => (
                <div key={result.rule.diagnosisId} className={`rounded-lg border p-3 bg-white ${idx === 0 ? 'border-violet-400 shadow-sm' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{result.rule.nameKo}</p>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap shrink-0">{CATEGORY_LABEL[result.rule.category] ?? result.rule.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${result.confidenceScore}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-violet-600 shrink-0 w-9 text-right">{result.confidenceScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // Default: engine-based panel
  if (!engineOutput) {
    return (
      <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 p-3">
        <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white rounded-lg border">
          <Microscope className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-semibold text-slate-500">소견 입력 시 자동 분석됩니다</p>
          <p className="text-xs mt-1 text-slate-400 leading-relaxed">
            검사 소견을 입력하면 실시간으로
            <br />
            감별 진단을 수행합니다
          </p>
        </div>
      </div>
    )
  }

  const { diagnoses, inflammationType, malignancySuspicion, criticalFindings } = engineOutput
  const topFive = [...diagnoses]
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 5)

  return (
    <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 p-3">

      {/* Section 1: 진단 결과 */}
      <section>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Microscope className="w-3.5 h-3.5" />
          진단 결과
        </h3>

        {topFive.length === 0 ? (
          <div className="rounded-lg border p-3 bg-white text-center text-xs text-slate-400">
            소견 입력 시 자동 분석됩니다
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {topFive.map((result, idx) => (
              <div
                key={result.rule.diagnosisId}
                className={`rounded-lg border p-3 bg-white transition-all ${
                  idx === 0
                    ? 'border-violet-400 shadow-sm shadow-violet-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                      {result.rule.nameKo}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                      {result.rule.nameEn}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap shrink-0">
                    {CATEGORY_LABEL[result.rule.category] ?? result.rule.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${result.confidenceScore}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-violet-600 shrink-0 w-9 text-right">
                    {result.confidenceScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: 염증 유형 */}
      {inflammationType !== null && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            염증 유형
          </h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${INFLAMMATION_COLOR[inflammationType]}`}
          >
            {INFLAMMATION_LABEL[inflammationType]}
          </span>
        </section>
      )}

      {/* Section 3: 악성도 의심 */}
      {malignancySuspicion !== null && malignancySuspicion !== 'none' && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            악성도 의심
          </h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${MALIGNANCY_CONFIG[malignancySuspicion].color}`}
          >
            {MALIGNANCY_CONFIG[malignancySuspicion].label}
          </span>
        </section>
      )}

      {/* Section 4: 중요 소견 */}
      {criticalFindings.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            중요 소견
          </h3>
          <div className="flex flex-col gap-1.5">
            {criticalFindings.map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-amber-800 leading-snug">{finding}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

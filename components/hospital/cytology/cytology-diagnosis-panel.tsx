'use client'

import React from 'react'
import { Microscope, AlertTriangle, FlaskConical, ShieldAlert } from 'lucide-react'
import type {
  CytologyEngineOutput,
  CytologySampleType,
} from '@/constants/hospital/cytology/cytology-types'

interface Props {
  engineOutput: CytologyEngineOutput | null
  sampleType: CytologySampleType
}

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

export default function CytologyDiagnosisPanel({ engineOutput }: Props) {
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

                {/* Confidence bar */}
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

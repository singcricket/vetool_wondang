'use client'

import React from 'react'
import { Eye, AlertCircle, Activity, ClipboardList, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { OphEngineOutput } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import { cn } from '@/lib/utils/utils'

interface Props {
  engineOutput: OphEngineOutput
  results: Record<string, string | string[]>
  summary: string | null
}

export default function OphthalmicDiagnosisPanel({ engineOutput, results, summary }: Props) {
  const { 
    activeSigns = [], 
    diagnoses = [], 
    criticalFindings = [], 
    visionStatus 
  } = engineOutput

  const hasAnyResults = Object.keys(results).length > 0
  const isNormal = activeSigns.length === 0 && hasAnyResults

  if (!hasAnyResults) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
        <Eye className="w-16 h-16 mb-6 opacity-20" />
        <p className="text-xl font-bold text-slate-500">검사 데이터를 기다리는 중</p>
        <p className="text-sm mt-3 leading-relaxed">
          검사 결과를 입력하시면 실시간으로<br/>
          이상 징후 분석 및 감별 진단을 수행합니다.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-5 border-b bg-slate-50 shrink-0">
        <h3 className="font-extrabold text-slate-800 flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-blue-600" />
          지능형 안과 분석 엔진
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
          Real-time pattern matching & diagnostic inference
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar">

        {/* Vision Status Section */}
        <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <h4 className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            Vision Assessment
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <VisionBadge eye="OD" status={visionStatus.od} />
            <VisionBadge eye="OS" status={visionStatus.os} />
          </div>
        </section>

        {/* Critical Findings Banner */}
        {criticalFindings.length > 0 && (
          <section className="animate-pulse">
            <div className="bg-rose-600 text-white rounded-xl p-4 shadow-lg shadow-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-black text-sm uppercase">Emergency Findings</h4>
              </div>
              <ul className="space-y-1.5">
                {criticalFindings.map((finding, idx) => (
                  <li key={idx} className="text-sm font-bold flex items-start gap-2 leading-tight">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Normal Status */}
        {isNormal && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-4 shadow-sm shadow-emerald-100/50">
            <ShieldCheck className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-sm font-black">특이 사항 없음</p>
              <p className="text-[11px] font-medium opacity-80 mt-0.5">현재 입력된 검사 결과에서 이상 징후가 발견되지 않았습니다.</p>
            </div>
          </div>
        )}

        {/* Diagnoses / DDx */}
        {diagnoses.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Differential Diagnosis (DDx)
            </h4>
            <div className="space-y-4">
              {diagnoses.sort((a, b) => b.confidenceScore - a.confidenceScore).map((diag, idx) => (
                <div key={idx} className="bg-white border rounded-2xl p-4 shadow-sm hover:border-blue-200 transition-all border-slate-200 group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-700 transition-colors">
                        {diag.rule.diagnosisNameKo}
                      </h5>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                        {diag.rule.diagnosisName}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-full border shadow-sm",
                      diag.confidenceScore >= 80 ? 'bg-blue-600 text-white border-blue-600' :
                      diag.confidenceScore >= 50 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    )}>
                      {diag.confidenceScore}% Confidence
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        diag.confidenceScore >= 80 ? 'bg-blue-600' :
                        diag.confidenceScore >= 50 ? 'bg-amber-500' :
                        'bg-slate-400'
                      )}
                      style={{ width: `${diag.confidenceScore}%` }}
                    />
                  </div>

                  {/* Matched Signs */}
                  {diag.matchedSigns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {diag.matchedSigns.map((sign, i) => (
                        <span key={i} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                          {sign.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Missing required signs */}
                  {diag.missingRequiredSigns.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">Missing:</span>
                      <div className="flex flex-wrap gap-1">
                        {diag.missingRequiredSigns.map((sign, i) => (
                          <span key={i} className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 line-through decoration-slate-300">
                            {sign.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Signs Tag Cloud */}
        {activeSigns.length > 0 && (
          <section>
            <h4 className="text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Identified Signs
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeSigns.map((sign, i) => (
                <span key={i} className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm hover:bg-slate-200 transition-colors cursor-default">
                  {sign.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Summary text */}
        {summary && (
          <section className="pt-6 border-t border-slate-100">
            <h4 className="text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Automatic Summary</h4>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs leading-relaxed font-mono shadow-inner border border-slate-800">
              {summary}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function VisionBadge({ eye, status }: { eye: 'OD' | 'OS', status: 'visual' | 'impaired' | 'blind' | 'unknown' }) {
  const getColors = () => {
    switch (status) {
      case 'visual': return 'bg-emerald-500 text-white shadow-emerald-200'
      case 'impaired': return 'bg-amber-500 text-white shadow-amber-200'
      case 'blind': return 'bg-rose-600 text-white shadow-rose-200 animate-pulse'
      default: return 'bg-slate-200 text-slate-500 shadow-transparent'
    }
  }

  const getLabel = () => {
    switch (status) {
      case 'visual': return 'Visual'
      case 'impaired': return 'Impaired'
      case 'blind': return 'Blind'
      default: return 'Unknown'
    }
  }

  const getLabelKo = () => {
    switch (status) {
      case 'visual': return '시력 있음'
      case 'impaired': return '시력 저하'
      case 'blind': return '시력 소실'
      default: return '평가 불가'
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border border-transparent shadow-lg transition-all", getColors())}>
      <span className="text-[10px] font-black opacity-80 uppercase mb-1">{eye}</span>
      <span className="text-base font-black leading-tight tracking-tight">{getLabel()}</span>
      <span className="text-[10px] font-bold opacity-90 mt-0.5">{getLabelKo()}</span>
    </div>
  )
}

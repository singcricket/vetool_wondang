'use client'

import React from 'react'
import { BrainCircuit, AlertCircle, MapPin, Activity, Brain, AlertTriangle } from 'lucide-react'

interface Props {
  localisations: any // LocalisationEngineOutput (from neuro_ref.ts)
  results: Record<string, string | string[]>
  summary: string | null
}

export default function NeuroLocalisationPanel({ localisations, results, summary }: Props) {
  // Extract engine outputs (Match names with runFullLocalisationEngine in neuro_ref.ts)
  const { 
    localisationCandidates: candidates = [], 
    detectedSyndromes: syndromes = [], 
    activeSigns = [],
    cerebralLateralisation = null,
    spinalLateralisation = null,
  } = localisations

  // 검사 결과가 전혀 없는 경우에만 빈 화면 표시
  const hasAnyResults = Object.keys(results).length > 0
  const isNormal = activeSigns.length === 0 && hasAnyResults

  if (!hasAnyResults) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">검사 결과를 입력해주세요</p>
        <p className="text-sm mt-2">입력된 데이터 패턴을 분석하여<br/>병변의 위치를 실시간으로 국소화합니다.</p>
      </div>
    )
  }

  const cerebralLat = cerebralLateralisation
  const spinalLat = spinalLateralisation

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-slate-50 shrink-0">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          신경계 국소화 엔진
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          실시간 패턴 분석 결과입니다. 임상적 참고용으로 활용하세요.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* 특이 소견 없음 배너 (정상이지만 다른 도메인 결과는 계속 표시) */}
        {isNormal && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2.5">
            <Activity className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">현재 입력된 항목 중 특이 소견이 감지되지 않았습니다.</p>
          </div>
        )}

        {/* Syndromes */}
        {syndromes && syndromes.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold text-rose-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              감지된 증후군 (Syndromes)
            </h4>
            <div className="space-y-3">
              {syndromes.map((syn: any) => (
                <div key={syn.syndromeID} className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                  <h5 className="font-bold text-rose-900 text-sm">{syn.nameKo}</h5>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">{syn.interpretationKo}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Localisations */}
        <section>
          <h4 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            예상 병변 위치 (Localisation)
          </h4>
          <div className="space-y-4">
            {candidates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">현재 입력된 소견으로는 특정 위치를 특정하기 어렵습니다.</p>
            ) : candidates.map((loc: any, idx: number) => (
              <div key={idx} className="bg-white border p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-slate-800">{loc.locationNameKo || loc.location}</h5>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    loc.confidenceScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                    loc.confidenceScore >= 50 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {loc.confidenceScore}% 매치
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      loc.confidenceScore >= 80 ? 'bg-emerald-500' :
                      loc.confidenceScore >= 50 ? 'bg-amber-500' :
                      'bg-slate-400'
                    }`}
                    style={{ width: `${loc.confidenceScore}%` }}
                  />
                </div>

                {/* Supporting findings */}
                {loc.supportingFindings && loc.supportingFindings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">지표 소견 (Supporting):</p>
                    <div className="flex flex-wrap gap-1">
                      {loc.supportingFindings.map((sign: string, i: number) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {sign.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {loc.contradictingFindings && loc.contradictingFindings.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-rose-500 mb-1">배제 소견 (Contradicting):</p>
                    <div className="flex flex-wrap gap-1">
                      {loc.contradictingFindings.map((sign: string, i: number) => (
                        <span key={i} className="text-[11px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100">
                          {sign.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Differentials */}
                {loc.differentials && loc.differentials.length > 0 && (
                  <div className="mt-3 bg-slate-50 p-2 rounded text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">DDx: </span>
                    {loc.differentials.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Cerebral Lateralisation Section ─────────────────────── */}
        {cerebralLat && cerebralLat.hemisphere !== 'undetermined' && (
          <section>
            <h4 className="text-sm font-semibold text-violet-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              대뇌 반구 편측화 (Hemisphere Lateralisation)
            </h4>

            {/* Main result card */}
            <div className={`p-4 rounded-xl border-2 mb-3 ${
              cerebralLat.hemisphere === 'bilateral' 
                ? 'bg-amber-50 border-amber-300' 
                : cerebralLat.confidence === 'high'
                  ? 'bg-violet-50 border-violet-300'
                  : cerebralLat.confidence === 'medium'
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                {/* Hemisphere visual */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {/* Left brain */}
                    <div className={`w-8 h-8 rounded-l-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                      cerebralLat.hemisphere === 'left' || cerebralLat.hemisphere === 'bilateral'
                        ? 'bg-violet-500 border-violet-600 text-white shadow-md scale-110'
                        : 'bg-slate-100 border-slate-300 text-slate-400'
                    }`}>L</div>
                    {/* Right brain */}
                    <div className={`w-8 h-8 rounded-r-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                      cerebralLat.hemisphere === 'right' || cerebralLat.hemisphere === 'bilateral'
                        ? 'bg-violet-500 border-violet-600 text-white shadow-md scale-110'
                        : 'bg-slate-100 border-slate-300 text-slate-400'
                    }`}>R</div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-base leading-tight">
                      {cerebralLat.hemisphere === 'left' ? '좌측 반구' 
                        : cerebralLat.hemisphere === 'right' ? '우측 반구'
                        : '양측성'}
                      {cerebralLat.conflicting && ' (⚠ 양측 근거)'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cerebralLat.hemisphere === 'left' ? '병변: 좌측 (Left hemisphere lesion suspected)'
                        : cerebralLat.hemisphere === 'right' ? '병변: 우측 (Right hemisphere lesion suspected)'
                        : '양측 또는 다발성 병변 가능'}
                    </p>
                  </div>
                </div>
                {/* Confidence badge */}
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  cerebralLat.confidence === 'high' ? 'bg-emerald-100 text-emerald-700'
                  : cerebralLat.confidence === 'medium' ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {cerebralLat.confidence === 'high' ? '높은 신뢰도'
                    : cerebralLat.confidence === 'medium' ? '중간 신뢰도'
                    : '낮은 신뢰도'}
                  {' '}({cerebralLat.confidenceScore}%)
                </span>
              </div>

              {/* Score bars */}
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] w-12 text-slate-500 shrink-0">좌측 (L)</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${(cerebralLat.leftScore / Math.max(cerebralLat.leftScore + cerebralLat.rightScore, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] w-5 text-slate-400 text-right">{cerebralLat.leftScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] w-12 text-slate-500 shrink-0">우측 (R)</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${(cerebralLat.rightScore / Math.max(cerebralLat.leftScore + cerebralLat.rightScore, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] w-5 text-slate-400 text-right">{cerebralLat.rightScore}</span>
                </div>
              </div>
            </div>

            {/* Conflicting warning */}
            {cerebralLat.conflicting && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  양측 상충 근거 감지 — 양측성 또는 다발성 병변을 고려하십시오.<br/>
                  (GME, 저장 질환, 뇌염, 양측 경색 등)
                </p>
              </div>
            )}

            {/* Caveat */}
            {cerebralLat.caveatKo && (
              <p className="text-[11px] text-slate-500 italic px-1">{cerebralLat.caveatKo}</p>
            )}

            {/* Supporting votes */}
            {cerebralLat.votes && cerebralLat.votes.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                  근거 소견 보기 ({cerebralLat.votes.length}개)
                </summary>
                <div className="mt-2 space-y-1.5">
                  {cerebralLat.votes.map((v: any, i: number) => (
                    <div key={i} className={`flex items-start gap-2 text-[11px] p-2 rounded ${
                      v.side === 'left' ? 'bg-violet-50' : 'bg-indigo-50'
                    }`}>
                      <span className={`font-bold shrink-0 ${v.side === 'left' ? 'text-violet-600' : 'text-indigo-600'}`}>
                        [{v.side === 'left' ? 'L' : 'R'} wt:{v.weight}]
                      </span>
                      <span className="text-slate-700 leading-relaxed">{v.reasoningKo}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>
        )}

        {/* ─── Spinal Lateralisation Section ─────────────────────── */}
        {spinalLat && spinalLat.side !== 'undetermined' && (
          <section>
            <h4 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              척수 편측화 (Spinal Lateralisation)
            </h4>

            {/* Main result card */}
            <div className={`p-4 rounded-xl border-2 mb-3 ${
              spinalLat.side === 'bilateral_symmetric' 
                ? 'bg-slate-50 border-slate-300' 
                : spinalLat.confidence === 'high'
                  ? 'bg-teal-50 border-teal-300'
                  : spinalLat.confidence === 'medium'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="font-bold text-slate-900 text-base leading-tight">
                    {spinalLat.side === 'left' ? '좌측 편측화' 
                      : spinalLat.side === 'right' ? '우측 편측화'
                      : spinalLat.side === 'bilateral_asymmetric' ? '양측성 (비대칭)'
                      : '양측성 (대칭)'}
                    {spinalLat.brownSequardSuspected && ' (⚠ Brown-Séquard 의심)'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  spinalLat.confidence === 'high' ? 'bg-emerald-100 text-emerald-700'
                  : spinalLat.confidence === 'medium' ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {spinalLat.confidence === 'high' ? '높은 신뢰도'
                    : spinalLat.confidence === 'medium' ? '중간 신뢰도'
                    : '낮은 신뢰도'}
                  {' '}({spinalLat.confidenceScore}%)
                </span>
              </div>
              
              <p className="text-xs text-slate-600 mb-3">
                {spinalLat.side === 'left' ? '병변: 좌측 척수 (Left hemicord lesion suspected)'
                  : spinalLat.side === 'right' ? '병변: 우측 척수 (Right hemicord lesion suspected)'
                  : '양측 또는 다발성 척수 병변 가능'}
              </p>

              {/* Supporting votes */}
              {spinalLat.votes && spinalLat.votes.length > 0 && (
                <div className="space-y-1.5">
                  {spinalLat.votes.map((v: any, i: number) => (
                    <div key={i} className={`flex items-start gap-2 text-[10px] p-1.5 rounded ${
                      v.side === 'left' ? 'bg-teal-50/50' : v.side === 'right' ? 'bg-emerald-50/50' : 'bg-slate-50'
                    }`}>
                      <span className={`font-bold shrink-0 ${v.side === 'left' ? 'text-teal-600' : 'text-emerald-600'}`}>
                        [{v.side === 'left' ? 'L' : v.side === 'right' ? 'R' : 'B'}]
                      </span>
                      <span className="text-slate-600 leading-tight">{v.reasoningKo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Summary text if generated */}
        {summary && (
          <section className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">차트 요약 (Summary)</h4>
            <div className="bg-slate-50 p-3 rounded border text-xs text-slate-600 whitespace-pre-wrap font-mono">
              {summary}
            </div>
          </section>
        )}
        
      </div>
    </div>
  )
}

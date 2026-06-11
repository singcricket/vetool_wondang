import type React from 'react'
import { Brain, MapPin, Activity, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import type { NeuroTestItem } from '@/constants/hospital/physical-exam/neuro/neuro_ref'
import { isNeuroStructured, type NeuroSectionStructured } from '@/types/hospital/checkup-type'
import { SectionTitle } from './report-ui'

// 도메인 인덱스 → 그라데이션 색상 순환
const DOMAIN_GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-cyan-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-fuchsia-500',
  'from-slate-500 to-indigo-600',
]

function resolveNeuroDisplay(
  test: NeuroTestItem,
  rawVal: string | string[] | undefined,
): { valueKo: string; isAbnormal: boolean } | null {
  if (rawVal === undefined || rawVal === null || rawVal === '') return null

  if (test.testType === 'select' || test.testType === 'grade') {
    const opts =
      test.testType === 'select'
        ? test.options
        : test.grades.map((g) => ({
            value: String(g.grade),
            resultTextKo: g.labelKo,
            isAbnormal: g.isAbnormal,
          }))
    const opt = opts.find((o) => o.value === String(rawVal))
    if (!opt) return null
    return { valueKo: opt.resultTextKo, isAbnormal: (opt as any).isAbnormal ?? false }
  }

  if (test.testType === 'multiselect' && Array.isArray(rawVal)) {
    if (rawVal.length === 0) return null
    const labels = rawVal.map((v) => {
      const o = test.options.find((op) => op.value === v)
      return o ? o.resultTextKo : v
    })
    const isAbnormal = rawVal.some((v) => {
      const o = test.options.find((op) => op.value === v)
      return o?.isAbnormal ?? false
    })
    return { valueKo: labels.join(', '), isAbnormal }
  }

  if (test.testType === 'boolean') {
    const isTrue = rawVal === 'true'
    return {
      valueKo: isTrue ? test.positiveResultTextKo : test.negativeResultTextKo,
      isAbnormal: isTrue ? test.positiveIsAbnormal : !test.positiveIsAbnormal,
    }
  }

  if (test.testType === 'range') {
    const num = parseFloat(String(rawVal))
    const seg = test.ranges.find(
      (r) => (r.min === null || num >= r.min) && (r.max === null || num < r.max),
    )
    return seg ? { valueKo: seg.resultTextKo, isAbnormal: seg.isAbnormal } : null
  }

  return { valueKo: String(rawVal), isAbnormal: false }
}

function NeuroContent({ data }: { data: NeuroSectionStructured | string | null }) {
  if (!data) return null

  // 단순 텍스트인 경우
  if (typeof data === 'string' || (typeof data === 'object' && !isNeuroStructured(data))) {
    const text = typeof data === 'string' ? data : ((data as any).notes as string | undefined) ?? ''
    if (!text.trim()) return null
    return (
      <div className="overflow-hidden rounded-[10px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/20">
            <Brain size={16} className="text-white" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-bold text-white">신경계 검사 소견</p>
        </div>
        <div className="bg-white p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{text}</p>
        </div>
      </div>
    )
  }

  const { results, localisations, summary } = data

  const filledSections = neuroReference.domainSections
    .map((sec) => {
      const items = sec.tests
        .map((test) => {
          const raw = results[test.testID]
          const resolved = resolveNeuroDisplay(test, raw as string | string[] | undefined)
          if (!resolved) return null
          return { test, ...resolved }
        })
        .filter(Boolean) as { test: NeuroTestItem; valueKo: string; isAbnormal: boolean }[]
      return items.length > 0 ? { ...sec, items } : null
    })
    .filter(Boolean) as (typeof neuroReference.domainSections[number] & {
      items: { test: NeuroTestItem; valueKo: string; isAbnormal: boolean }[]
    })[]

  if (filledSections.length === 0 && !summary && !localisations) return null

  const hasLocalisations =
    (localisations?.localisationCandidates?.length ?? 0) > 0 ||
    (localisations?.detectedSyndromes?.length ?? 0) > 0 ||
    (localisations?.cerebralLateralisation &&
      localisations.cerebralLateralisation.hemisphere !== 'undetermined')

  return (
    <div className="flex flex-col gap-4">

      {/* 차트 연동 배지 + 요약 */}
      <div className="overflow-hidden rounded-[10px] border border-teal-200 shadow-sm">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/20">
            <Brain size={16} className="text-white" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-bold text-white">신경계 종합 소견</p>
          <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
            차트 연동
          </span>
        </div>
        {summary && (
          <div className="bg-teal-50 px-5 py-4">
            <p className="text-sm leading-relaxed text-teal-800">{summary}</p>
          </div>
        )}
        {!summary && (
          <div className="bg-white px-5 py-3">
            <p className="text-xs text-slate-400">종합 소견이 작성되지 않았습니다.</p>
          </div>
        )}
      </div>

      {/* 도메인별 카드 */}
      {filledSections.map((sec, idx) => {
        const abnormalCount = sec.items.filter((i) => i.isAbnormal).length
        const gradient = DOMAIN_GRADIENTS[idx % DOMAIN_GRADIENTS.length]
        return (
          <div
            key={sec.domain}
            className="overflow-hidden rounded-[10px] border border-slate-200 shadow-sm"
          >
            {/* 도메인 헤더 */}
            <div className={`flex items-center gap-2.5 bg-gradient-to-r ${gradient} px-4 py-3`}>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                <Activity size={14} className="text-white" strokeWidth={1.75} />
              </div>
              <p className="flex-1 text-sm font-bold text-white">{sec.domainNameKo}</p>
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {abnormalCount > 0 ? `이상 ${abnormalCount}건` : '정상'}
              </span>
            </div>

            {/* 검사 항목 목록 */}
            <div className="divide-y divide-slate-100 bg-white">
              {sec.items.map(({ test, valueKo, isAbnormal }) => (
                <div
                  key={test.testID}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 ${isAbnormal ? 'bg-amber-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {isAbnormal
                      ? <AlertCircle size={13} className="shrink-0 text-amber-500" strokeWidth={2} />
                      : <CheckCircle2 size={13} className="shrink-0 text-emerald-400" strokeWidth={2} />
                    }
                    <span className={`text-xs font-semibold ${isAbnormal ? 'text-amber-700' : 'text-slate-500'}`}>
                      {test.testNameKo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isAbnormal ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                      {valueKo}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isAbnormal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                      {isAbnormal ? '이상' : '정상'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* 병변 위치 분석 */}
      {hasLocalisations && (
        <div className="overflow-hidden rounded-[10px] border border-indigo-200 shadow-sm">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/20">
              <MapPin size={16} className="text-white" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-bold text-white">병변 위치 분석</p>
          </div>

          <div className="flex flex-col gap-5 bg-white p-5">

            {(localisations.detectedSyndromes?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <Zap size={13} strokeWidth={2} />감지된 증후군
                </p>
                <div className="flex flex-col gap-2">
                  {localisations.detectedSyndromes!.map((s, i) => (
                    <div key={i} className="rounded-[10px] border border-indigo-100 bg-indigo-50 px-4 py-3">
                      <p className="text-sm font-semibold text-indigo-800">{s.nameKo}</p>
                      {s.interpretationKo && (
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{s.interpretationKo}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(localisations.localisationCandidates?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <MapPin size={13} strokeWidth={2} />예상 병변 위치
                </p>
                <div className="flex flex-col gap-2">
                  {localisations.localisationCandidates!.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                        {c.locationNameKo ?? c.location}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-indigo-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${c.confidenceScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-indigo-600">{c.confidenceScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {localisations.cerebralLateralisation &&
              localisations.cerebralLateralisation.hemisphere !== 'undetermined' && (
              <div>
                <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <Activity size={13} strokeWidth={2} />대뇌 반구 편측화
                </p>
                <div className="rounded-[10px] border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <p className="text-sm font-semibold text-indigo-800">
                    {localisations.cerebralLateralisation.hemisphere === 'left' ? '좌측'
                     : localisations.cerebralLateralisation.hemisphere === 'right' ? '우측'
                     : '양측'}{' '}
                    반구 병변 의심
                  </p>
                  <p className="mt-0.5 text-xs text-indigo-600">
                    신뢰도 {localisations.cerebralLateralisation.confidenceScore}%
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

export function NeuroSection({ data }: { data: NeuroSectionStructured | string | null }) {
  if (!data) return null
  return (
    <section className="mb-10 break-inside-avoid">
      <SectionTitle>신경계 검사</SectionTitle>
      <NeuroContent data={data} />
    </section>
  )
}

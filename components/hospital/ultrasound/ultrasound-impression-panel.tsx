'use client'

import React from 'react'
import {
  evaluateImpressionRules,
  buildChartSummary,
  organSections,
} from '@/constants/hospital/ultrasound/ultrasound_testref'
import { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'

interface Props {
  organsData: Record<string, UltrasoundChartOrgan>
}

export default function UltrasoundImpressionPanel({ organsData }: Props) {
  const allFindings: Record<string, any> = {}
  const summaries: string[] = []

  // 장기 섹션 순서(scanningOrder)대로 요약문 생성
  organSections.forEach(section => {
    const organ = organsData[section.organ]
    if (!organ) return

    if (organ.status === 'abnormal' && organ.findings_data) {
      // 1. DDx용 (전체 병합)
      Object.assign(allFindings, organ.findings_data)

      // 2. 요약용 (장기별)
      const organSummaries = buildChartSummary(
        organ.findings_data as Record<string, string | number>,
        'ko',
        section.organ
      )
      summaries.push(...organSummaries)
    } else if (organ.status === 'normal') {
      summaries.push(`[${section.organNameKo}] 특이적인 이상 소견이 관찰되지 않음`)
    }
  })

  const matchedRules = evaluateImpressionRules(allFindings)

  if (summaries.length === 0 && matchedRules.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-2">이상 소견 및 감별 진단 (DDx)</h3>
        <p className="text-xs text-slate-400">입력된 이상 소견이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-6 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          📝 주요 이상 소견 요약
        </h3>
        {summaries.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
            {summaries.map((summary, idx) => (
              <li key={idx}>{summary}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">이상 소견 없음</p>
        )}
      </div>

      {matchedRules.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            💡 감별 진단 (DDx) 추천
          </h3>
          <div className="space-y-4">
            {matchedRules.map((rule, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-100 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                    {rule.severity.toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-amber-900">{rule.impressionKo}</span>
                </div>
                <div className="text-xs text-amber-800 mb-2">
                  <span className="font-semibold">DDx:</span> {rule.differentialsKo.join(', ')}
                </div>
                {rule.recommendationKo && (
                  <div className="text-xs text-amber-700 bg-white/50 p-2 rounded">
                    <span className="font-semibold">권장:</span> {rule.recommendationKo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

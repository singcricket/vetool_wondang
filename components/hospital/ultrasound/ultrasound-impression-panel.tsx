'use client'

import React from 'react'
import {
  evaluateImpressionRules,
  buildChartSummary,
  organSections,
} from '@/constants/hospital/ultrasound'
import { UltrasoundChartOrgan } from '@/types/hospital/ultrasound-type'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface Props {
  organsData: Record<string, UltrasoundChartOrgan>
  lang?: 'ko' | 'en'
  species?: string
}

export default function UltrasoundImpressionPanel({ organsData, lang = 'ko', species }: Props) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(lang === 'ko' ? '클립보드에 복사되었습니다.' : 'Copied to clipboard')
  }

  const allFindings: Record<string, any> = {}
  const summaries: string[] = []

  // 장기 섹션 순서(scanningOrder)대로 요약문 생성
  organSections.forEach(section => {
    const organ = organsData[section.organ]
    if (!organ) return

    // 1. 표준 소견 추출 (normal 포함 — 참고치 기록이 있을 수 있음)
    const organSummaries = (organ.status === 'abnormal' || organ.status === 'absent' || organ.status === 'normal') && organ.findings_data
      ? buildChartSummary(
          organ.findings_data as Record<string, string | number>,
          lang,
          section.organ,
          'vet',
          species,
        )
      : []

    if ((organ.status === 'abnormal' || organ.status === 'absent' || organ.status === 'normal') && organ.findings_data) {
      Object.assign(allFindings, organ.findings_data)
    }

    // 2. 메모 추가
    const organLines = [...organSummaries]
    if (organ.organ_memo?.trim()) {
      organLines.push(`(메모) ${organ.organ_memo.trim()}`)
    }

    // 3. 최종 요약문 구성
    if (organLines.length > 0) {
      const prefix = lang === 'ko' ? section.organNameKo : section.organName
      summaries.push(`[${prefix}]\n${organLines.join('\n')}`)
    } else if (organ.status === 'normal') {
      const normalPhrase = lang === 'ko' 
        ? `[${section.organNameKo}] 특이적인 이상 소견이 관찰되지 않음`
        : `[${section.organName}] No significant abnormalities observed`;
      summaries.push(normalPhrase)
    }
  })

  const matchedRules = evaluateImpressionRules(allFindings)

  const handleCopyDDx = () => {
    const text = matchedRules.map(rule => {
      const impression = lang === 'ko' ? rule.impressionKo : rule.impression
      const ddx = lang === 'ko' ? rule.differentialsKo.join(', ') : rule.differentials.join(', ')
      const rec = lang === 'ko' ? rule.recommendationKo : rule.recommendation
      return `[${rule.severity.toUpperCase()}] ${impression}\n- DDx: ${ddx}${rec ? `\n- Rec: ${rec}` : ''}`
    }).join('\n\n')
    handleCopy(text)
  }

  if (summaries.length === 0 && matchedRules.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-2">
          {lang === 'ko' ? '이상 소견 및 감별 진단 (DDx)' : 'Findings & DDx'}
        </h3>
        <p className="text-xs text-slate-400">
          {lang === 'ko' ? '입력된 이상 소견이 없습니다.' : 'No abnormal findings entered.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-6 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between group">
          <div className="flex items-center gap-2">
            {lang === 'ko' ? '📝 주요 이상 소견 요약' : '📝 Summary of Findings'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleCopy(summaries.join('\n'))}
            title={lang === 'ko' ? '복사' : 'Copy'}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </h3>
        {summaries.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-3">
            {summaries.map((summary, idx) => (
              <li key={idx} className="whitespace-pre-wrap leading-relaxed">{summary}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">
            {lang === 'ko' ? '이상 소견 없음' : 'No abnormalities'}
          </p>
        )}
      </div>

      {matchedRules.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between group">
            <div className="flex items-center gap-2">
              {lang === 'ko' ? '💡 감별 진단 (DDx) 추천' : '💡 DDx Recommendations'}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopyDDx}
              title={lang === 'ko' ? '복사' : 'Copy'}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </h3>
          <div className="space-y-4">
            {matchedRules.map((rule, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-100 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                    {rule.severity.toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-amber-900">
                    {lang === 'ko' ? rule.impressionKo : rule.impression}
                  </span>
                </div>
                <div className="text-xs text-amber-800 mb-2">
                  <span className="font-semibold">DDx:</span> {lang === 'ko' ? rule.differentialsKo.join(', ') : rule.differentials.join(', ')}
                </div>
                {((lang === 'ko' && rule.recommendationKo) || (lang === 'en' && rule.recommendation)) && (
                  <div className="text-xs text-amber-700 bg-white/50 p-2 rounded">
                    <span className="font-semibold">{lang === 'ko' ? '권장' : 'Rec'}:</span> {lang === 'ko' ? rule.recommendationKo : rule.recommendation}
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

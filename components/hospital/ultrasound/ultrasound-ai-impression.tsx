'use client'

import { useState } from 'react'
import { Sparkles, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { AiUltrasoundImpressionResult } from '@/lib/actions/ultrasound/ai-ultrasound-impression'

interface Props {
  result: AiUltrasoundImpressionResult | null
  isLoading: boolean
}

export default function UltrasoundAiImpression({ result, isLoading }: Props) {
  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [expanded, setExpanded] = useState(true)

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('클립보드에 복사되었습니다.')
  }

  const copyAll = () => {
    if (!result) return
    const isKo = lang === 'ko'
    const lines = [
      `[종합 소견]\n${isKo ? result.comprehensive_impression_ko : result.comprehensive_impression_en}`,
      `\n[주진단]\n${isKo ? result.primary_dx_ko : result.primary_dx_en}`,
      `\n[감별 진단]\n${(isKo ? result.ddx_ko : result.ddx_en).map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
      `\n[주요 소견]\n${(isKo ? result.key_findings_ko : result.key_findings_en).map(f => `• ${f}`).join('\n')}`,
      `\n[권장 사항]\n${isKo ? result.recommendations_ko : result.recommendations_en}`,
    ]
    copy(lines.join('\n'))
  }

  if (!result && !isLoading) return null

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-bold text-indigo-800">AI 종합 소견</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">BETA</span>
        </div>
        {result && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-indigo-100 text-indigo-400"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-3 py-4 text-indigo-600">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">AI가 초음파 소견을 분석하고 있습니다...</span>
          </div>
        )}

        {/* Result */}
        {result && expanded && !isLoading && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Lang toggle + copy all */}
            <div className="flex items-center justify-between">
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  onClick={() => setLang('ko')}
                  className={`px-3 py-1 font-medium transition-colors ${lang === 'ko' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  한국어
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 font-medium transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  English
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-slate-400 hover:text-slate-600 gap-1 px-2"
                onClick={copyAll}
              >
                <Copy size={11} /> 전체 복사
              </Button>
            </div>

            <Section title={lang === 'ko' ? '📝 종합 소견' : '📝 Comprehensive Impression'} onCopy={() => copy(lang === 'ko' ? result.comprehensive_impression_ko : result.comprehensive_impression_en)}>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {lang === 'ko' ? result.comprehensive_impression_ko : result.comprehensive_impression_en}
              </p>
            </Section>

            <Section title={lang === 'ko' ? '🎯 주진단' : '🎯 Primary Dx'} onCopy={() => copy(lang === 'ko' ? result.primary_dx_ko : result.primary_dx_en)}>
              <p className="text-sm font-semibold text-indigo-700">
                {lang === 'ko' ? result.primary_dx_ko : result.primary_dx_en}
              </p>
            </Section>

            <Section title={lang === 'ko' ? '🔀 감별 진단 (DDx)' : '🔀 Differential Diagnoses'} onCopy={() => copy((lang === 'ko' ? result.ddx_ko : result.ddx_en).join('\n'))}>
              <ol className="space-y-1">
                {(lang === 'ko' ? result.ddx_ko : result.ddx_en).map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {d}
                  </li>
                ))}
              </ol>
            </Section>

            <Section title={lang === 'ko' ? '🔑 주요 근거 소견' : '🔑 Key Supporting Findings'} onCopy={() => copy((lang === 'ko' ? result.key_findings_ko : result.key_findings_en).map(f => `• ${f}`).join('\n'))}>
              <ul className="space-y-1">
                {(lang === 'ko' ? result.key_findings_ko : result.key_findings_en).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={lang === 'ko' ? '📋 권장 사항' : '📋 Recommendations'} onCopy={() => copy(lang === 'ko' ? result.recommendations_ko : result.recommendations_en)}>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {lang === 'ko' ? result.recommendations_ko : result.recommendations_en}
              </p>
            </Section>

            <p className="text-[10px] text-slate-300 text-right pt-1">
              AI 생성 소견은 참고용이며 최종 판단은 담당 수의사에게 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, onCopy, children }: { title: string; onCopy: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">{title}</span>
        <button onClick={onCopy} className="text-slate-300 hover:text-slate-500 transition-colors">
          <Copy size={12} />
        </button>
      </div>
      {children}
    </div>
  )
}

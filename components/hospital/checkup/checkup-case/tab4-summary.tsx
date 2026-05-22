'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import type { CheckupAiResult } from '@/types/hospital/checkup-type'

interface Props {
  checkupId: string
  aiResult: CheckupAiResult | null
  status: string
  onStatusChange: (status: 'reviewing' | 'approved') => void
}

export default function Tab4Summary({ checkupId, aiResult, status, onStatusChange }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* AI 분석 트리거 */}
      {!aiResult && (
        <div className="rounded-lg border border-dashed border-teal-300 bg-teal-50 p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-teal-500" />
          <p className="mb-1 text-sm font-medium text-teal-800">AI 종합소견 생성</p>
          <p className="mb-4 text-xs text-teal-600">
            모든 검사 데이터 입력 완료 후 AI 종합소견을 생성하세요.
          </p>
          <Button size="sm" variant="outline" className="border-teal-500 text-teal-700 hover:bg-teal-100">
            <Sparkles className="mr-1 h-4 w-4" />
            AI 종합소견 생성
          </Button>
        </div>
      )}

      {aiResult && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">AI 종합소견</span>
            <Button size="sm" variant="ghost" className="text-xs text-teal-600">
              <Sparkles className="mr-1 h-3 w-3" />
              재생성
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">종합소견</Label>
            <Textarea
              defaultValue={aiResult.summary ?? ''}
              className="min-h-[120px] resize-none text-sm"
              placeholder="AI가 생성한 종합소견 (수정 가능)"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">체중·영양 관리 권고</Label>
            <Textarea
              defaultValue={aiResult.weight_advice ?? ''}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          {aiResult.abnormal_findings.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs">주요 이상소견</Label>
              <div className="rounded-md border divide-y text-sm">
                {aiResult.abnormal_findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2">
                    <span className="font-medium text-slate-800 w-16 shrink-0">{f.item}</span>
                    <span className="text-slate-500 w-20 shrink-0">
                      {f.value} {f.unit}
                    </span>
                    <span className="text-xs text-slate-500 w-24 shrink-0">
                      (기준: {f.ref_range})
                    </span>
                    <span className="text-xs text-slate-600 flex-1">{f.interpretation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiResult.monitoring_items.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs">모니터링·재검 권고</Label>
              <div className="flex flex-wrap gap-2">
                {aiResult.monitoring_items.map((m, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={
                      m.priority === 'high'
                        ? 'border-red-300 text-red-700'
                        : m.priority === 'medium'
                          ? 'border-amber-300 text-amber-700'
                          : 'border-slate-300 text-slate-600'
                    }
                  >
                    {m.item} ({m.interval})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상태 버튼 */}
      <div className="mt-2 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {status === 'draft' && <span>작성 중</span>}
          {status === 'reviewing' && <span className="text-amber-600 font-medium">검토 중</span>}
          {status === 'approved' && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={14} /> 승인 완료
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('reviewing')}
            >
              검토 요청
            </Button>
          )}
          {status === 'reviewing' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onStatusChange('approved')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              최종 승인
            </Button>
          )}
          {status === 'approved' && (
            <Button size="sm" variant="outline" className="text-slate-500">
              리포트 공유
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

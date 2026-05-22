'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import type { CheckupSection, CheckupAiResult, CheckupStatus } from '@/types/hospital/checkup-type'

interface Props {
  checkupId: string
  assessmentSection: CheckupSection | undefined
  planSection: CheckupSection | undefined
  aiResult: CheckupAiResult | null
  status: CheckupStatus
  onStatusChange: (status: 'reviewing' | 'approved') => void
}

type AssessmentData = {
  problem_list: string
  diagnosis: string
  differential_diagnosis: string
}

type PlanData = {
  treatment_plan: string
  prescription: string
  recheck_schedule: string
  owner_instructions: string
}

export default function Tab5Plan({
  checkupId,
  assessmentSection,
  planSection,
  aiResult,
  status,
  onStatusChange,
}: Props) {
  const savedA = (assessmentSection?.data ?? {}) as Partial<AssessmentData>
  const savedP = (planSection?.data ?? {}) as Partial<PlanData>

  const [assessment, setAssessment] = useState<AssessmentData>({
    problem_list: savedA.problem_list ?? '',
    diagnosis: savedA.diagnosis ?? '',
    differential_diagnosis: savedA.differential_diagnosis ?? '',
  })

  const [plan, setPlan] = useState<PlanData>({
    treatment_plan: savedP.treatment_plan ?? '',
    prescription: savedP.prescription ?? '',
    recheck_schedule: savedP.recheck_schedule ?? '',
    owner_instructions: savedP.owner_instructions ?? '',
  })

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all([
        upsertCheckupSection({ checkupId, sectionType: 'assessment', data: assessment }),
        upsertCheckupSection({ checkupId, sectionType: 'plan', data: plan }),
      ])
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">

      {/* AI 종합소견 */}
      {!aiResult ? (
        <div className="rounded-lg border border-dashed border-teal-300 bg-teal-50 p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-teal-500" />
          <p className="mb-1 text-sm font-medium text-teal-800">AI 종합소견 생성</p>
          <p className="mb-4 text-xs text-teal-600">
            탭1~4 검사 데이터 입력 완료 후 AI 종합소견을 생성하세요.
          </p>
          <Button size="sm" variant="outline" className="border-teal-500 text-teal-700 hover:bg-teal-100" disabled>
            <Sparkles className="mr-1 h-4 w-4" />
            AI 종합소견 생성 (준비 중)
          </Button>
        </div>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between border-b pb-1">
            <h3 className="text-sm font-semibold text-slate-700">AI 종합소견</h3>
            <Button size="sm" variant="ghost" className="text-xs text-teal-600" disabled>
              <Sparkles className="mr-1 h-3 w-3" />
              재생성
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">종합소견</Label>
              <Textarea
                defaultValue={aiResult.summary ?? ''}
                className="min-h-[100px] resize-none text-sm"
                placeholder="AI가 생성한 종합소견"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">체중·영양 관리 권고</Label>
              <Textarea
                defaultValue={aiResult.weight_advice ?? ''}
                className="min-h-[70px] resize-none text-sm"
              />
            </div>

            {aiResult.abnormal_findings.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs">주요 이상소견</Label>
                <div className="rounded-md border divide-y text-sm">
                  {aiResult.abnormal_findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2">
                      <span className="font-medium text-slate-800 w-16 shrink-0">{f.item}</span>
                      <span className="text-slate-500 w-20 shrink-0">{f.value} {f.unit}</span>
                      <span className="text-xs text-slate-500 w-24 shrink-0">(기준: {f.ref_range})</span>
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
        </section>
      )}

      {/* 평가 */}
      <section>
        <h3 className="mb-3 border-b pb-1 text-sm font-semibold text-slate-700">평가 (Assessment)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ['problem_list', '문제 목록 (Problem List)'],
            ['diagnosis', '진단 (Diagnosis)'],
            ['differential_diagnosis', '감별진단 (Differential Diagnosis)'],
          ] as [keyof AssessmentData, string][]).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label className="text-xs">{label}</Label>
              <Textarea
                value={assessment[key]}
                onChange={(e) => setAssessment((p) => ({ ...p, [key]: e.target.value }))}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 계획 */}
      <section>
        <h3 className="mb-3 border-b pb-1 text-sm font-semibold text-slate-700">계획 (Plan)</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ['treatment_plan', '치료 계획'],
            ['prescription', '처방 (Rx)'],
            ['recheck_schedule', '재검 일정'],
            ['owner_instructions', '보호자 교육 사항'],
          ] as [keyof PlanData, string][]).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label className="text-xs">{label}</Label>
              <Textarea
                value={plan[key]}
                onChange={(e) => setPlan((p) => ({ ...p, [key]: e.target.value }))}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {status === 'draft' && <span>작성 중</span>}
          {status === 'reviewing' && <span className="font-medium text-amber-600">검토 중</span>}
          {status === 'approved' && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2 size={14} /> 승인 완료
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? '저장 중...' : '저장'}
          </Button>
          {status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange('reviewing')}>
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
        </div>
      </div>
    </div>
  )
}

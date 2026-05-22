'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import type { CheckupSection } from '@/types/hospital/checkup-type'

interface Props {
  checkupId: string
  assessmentSection: CheckupSection | undefined
  planSection: CheckupSection | undefined
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

export default function Tab3Assessment({ checkupId, assessmentSection, planSection }: Props) {
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
      {/* 평가 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 border-b pb-1">평가 (Assessment)</h3>
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
                className="min-h-[90px] resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 계획 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 border-b pb-1">계획 (Plan)</h3>
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
                className="min-h-[90px] resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}

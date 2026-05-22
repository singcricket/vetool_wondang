'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import type { CheckupSection } from '@/types/hospital/checkup-type'
import type { ExtractedInquiry } from '@/lib/actions/checkup/pdf-extraction'

interface Props {
  checkupId: string
  section: CheckupSection | undefined
  extractedInquiry: ExtractedInquiry | null
}

type InquiryData = {
  chief_complaint: string
  history: string
  living_env: string
  diet: string
  current_medications: string
}

export default function Tab1Inquiry({ checkupId, section, extractedInquiry }: Props) {
  const saved = (section?.data ?? {}) as Partial<InquiryData>
  const [form, setForm] = useState<InquiryData>({
    chief_complaint: saved.chief_complaint ?? '',
    history: saved.history ?? '',
    living_env: saved.living_env ?? '',
    diet: saved.diet ?? '',
    current_medications: saved.current_medications ?? '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!extractedInquiry) return
    setForm((prev) => ({
      chief_complaint: prev.chief_complaint || extractedInquiry.chief_complaint,
      history: prev.history || extractedInquiry.history,
      living_env: prev.living_env || extractedInquiry.living_env,
      diet: prev.diet || extractedInquiry.diet,
      current_medications: prev.current_medications || extractedInquiry.current_medications,
    }))
  }, [extractedInquiry])

  const handleSave = async () => {
    try {
      setSaving(true)
      await upsertCheckupSection({ checkupId, sectionType: 'inquiry', data: form })
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof InquiryData, label: string, placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Textarea
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('chief_complaint', '주증상 (Chief Complaint)', '주요 증상을 입력하세요')}
        {field('history', '병력 (History)', '과거 병력, 수술 이력, 예방접종 등')}
        {field('living_env', '생활환경', '실내/실외, 운동량, 동거 동물 등')}
        {field('diet', '식이 (Diet)', '현재 급여 사료 종류 및 브랜드, 급여량, 급여 횟수, 간식 종류 및 양')}
        {field('current_medications', '현재 약물 및 보조제', '약물명, 용량, 투여 기간')}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import type { CheckupSection } from '@/types/hospital/checkup-type'
import type { ExtractedPhysical } from '@/lib/actions/checkup/pdf-extraction'
import PhysicalExamSection, { type PhysicalValues } from './physical-exam-section'
import { physicalRefAll } from '@/constants/hospital/checkup/physical-ref'

interface Props {
  checkupId: string
  physicalSection: CheckupSection | undefined
  extractedPhysical: ExtractedPhysical | null
}

const EXTRACTED_PHYSICAL_MAP: Record<keyof ExtractedPhysical, string> = {
  body_weight: 'body_weight',
  bcs: 'bcs',
  temperature: 'temperature',
  pulse: 'heart_rate',
  respiration: 'respiratory_rate',
}

export default function Tab2Physical({ checkupId, physicalSection, extractedPhysical }: Props) {
  const savedPhysical = (physicalSection?.data ?? {}) as Record<string, string>

  const [physical, setPhysical] = useState<PhysicalValues>(() => {
    const init: PhysicalValues = {}
    physicalRefAll.forEach((ref) => {
      init[ref.id] = savedPhysical[ref.id] ?? ''
    })
    return init
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!extractedPhysical) return
    setPhysical((prev) => {
      const next = { ...prev }
      for (const [key, refId] of Object.entries(EXTRACTED_PHYSICAL_MAP)) {
        const extracted = extractedPhysical[key as keyof ExtractedPhysical]
        if (extracted && !next[refId]) {
          next[refId] = extracted
        }
      }
      return next
    })
  }, [extractedPhysical])

  const handleSave = async () => {
    try {
      setSaving(true)
      await upsertCheckupSection({ checkupId, sectionType: 'physical', data: physical })
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PhysicalExamSection
        values={physical}
        onChange={(id, value) => setPhysical((prev) => ({ ...prev, [id]: value }))}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}

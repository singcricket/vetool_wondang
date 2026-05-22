'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import type { CheckupPatient, CheckupSection } from '@/types/hospital/checkup-type'
import {
  labRefCbc,
  labRefChemistry,
  labRefEndocrine,
  labRefUrinalysis,
  labRefSpecial,
  labRefMap,
  type LabRefItem,
  type LabResultItem,
  type LabSection,
  type LabSeverity,
} from '@/constants/hospital/checkup/lab-ref'
import { evaluateLabValue, getAutoComment, getDefaultRefRange } from '@/lib/utils/lab-evaluate'

interface Props {
  checkupId: string
  patient: CheckupPatient
  labSection: CheckupSection | undefined
  extractedLabItems: LabResultItem[] | null
}

const SEVERITY_BADGE: Record<LabSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  moderate: 'bg-yellow-400 text-slate-800',
  mild:     'bg-slate-200 text-slate-700',
}

const LAB_GROUPS: { label: string; section: LabSection; items: LabRefItem[] }[] = [
  { label: 'CBC (혈액검사)', section: 'cbc', items: labRefCbc },
  { label: '혈청화학', section: 'chemistry', items: labRefChemistry },
  { label: '내분비', section: 'endocrine', items: labRefEndocrine },
  { label: '요검사', section: 'urinalysis', items: labRefUrinalysis },
  { label: '특수검사', section: 'special', items: labRefSpecial },
]

function initLabItems(
  refItems: LabRefItem[],
  existingMap: Record<string, LabResultItem>,
  species: string,
): LabResultItem[] {
  return refItems.map((ref) => ({
    id: ref.id,
    nameEn: ref.nameEn,
    nameKo: ref.nameKo,
    unit: ref.unit,
    value: existingMap[ref.id]?.value ?? null,
    ref_range: existingMap[ref.id]?.ref_range ?? getDefaultRefRange(ref, species) ?? null,
    is_abnormal: existingMap[ref.id]?.is_abnormal ?? null,
    result_text: existingMap[ref.id]?.result_text ?? null,
    severity: existingMap[ref.id]?.severity ?? null,
    comment: existingMap[ref.id]?.comment ?? null,
    section: ref.section,
  }))
}

export default function Tab3Lab({ checkupId, patient, labSection, extractedLabItems }: Props) {
  const savedLabItems = ((labSection?.data as any)?.items ?? []) as LabResultItem[]
  const savedLabMap: Record<string, LabResultItem> = Object.fromEntries(
    savedLabItems.map((item) => [item.id, item]),
  )

  const species = patient.species ?? ''
  const [labGroups, setLabGroups] = useState(() =>
    LAB_GROUPS.map((g) => ({
      ...g,
      results: initLabItems(g.items, savedLabMap, species),
    })),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!extractedLabItems || extractedLabItems.length === 0) return
    const extractedMap: Record<string, LabResultItem> = Object.fromEntries(
      extractedLabItems.map((item) => [item.id, item]),
    )
    setLabGroups((prev) =>
      prev.map((g) => ({
        ...g,
        results: g.results.map((r) => {
          const extracted = extractedMap[r.id]
          if (!extracted) return r
          const valueFromAi = r.value === null ? extracted.value : r.value
          return {
            ...r,
            value: valueFromAi,
            ref_range: extracted.ref_range ?? r.ref_range,
            is_abnormal: r.is_abnormal ?? extracted.is_abnormal,
            source: r.value === null && extracted.value !== null ? ('ai' as const) : r.source,
          }
        }),
      })),
    )
  }, [extractedLabItems])

  const updateLabItem = (
    groupIdx: number,
    itemIdx: number,
    field: 'value' | 'ref_range' | 'is_abnormal' | 'comment',
    val: string | boolean | null,
  ) => {
    setLabGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== groupIdx) return g
        return {
          ...g,
          results: g.results.map((r, ri) => {
            if (ri !== itemIdx) return r
            const updated = { ...r, [field]: val }
            if (field === 'value') {
              const ref = labRefMap[r.id]
              const evaled = ref
                ? evaluateLabValue(
                    val as string | null,
                    ref,
                    patient.species ?? '',
                    r.source,
                    r.source === 'ai' ? r.ref_range : null,
                  )
                : null
              if (evaled) {
                updated.is_abnormal = evaled.isAbnormal
                updated.result_text = evaled.resultTextKo
                updated.severity    = evaled.severity
                if (evaled.isAbnormal && !r.comment && ref) {
                  updated.comment = getAutoComment(ref, evaled.direction)
                } else if (!evaled.isAbnormal) {
                  updated.comment = null
                }
              } else {
                updated.result_text = null
                updated.severity    = null
                updated.comment     = null
              }
            }
            return updated
          }),
        }
      }),
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const allLabItems = labGroups.flatMap((g) =>
        g.results.filter((r) => r.value !== null && r.value !== ''),
      )
      await upsertCheckupSection({ checkupId, sectionType: 'lab', data: { items: allLabItems } })
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-slate-400">값이 입력된 항목만 저장됩니다.</p>

      {labGroups.map((group, gi) => (
        <div key={group.section} className="mb-2">
          <p className="mb-1.5 rounded bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
            {group.label}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="w-32 pb-1 pr-3 font-medium">항목</th>
                  <th className="w-36 pb-1 pr-3 font-medium">측정값</th>
                  <th className="w-20 pb-1 pr-3 font-medium">단위</th>
                  <th className="w-32 pb-1 pr-3 font-medium">참고범위</th>
                  <th className="pb-1 font-medium">평가</th>
                </tr>
              </thead>
              <tbody>
                {group.results.map((item, ii) => {
                  const ref = labRefMap[item.id]
                  const testType = ref?.testType ?? 'range'
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={item.is_abnormal ? 'bg-red-50' : ''}>
                        <td className="py-0.5 pr-3">
                          <span className="font-medium text-slate-800">{item.nameEn}</span>
                          <span className="ml-1 text-slate-400">{item.nameKo}</span>
                        </td>
                        <td className="py-0.5 pr-3">
                          {testType === 'select' && ref?.options ? (
                            <Select
                              value={item.value ?? ''}
                              onValueChange={(v) => updateLabItem(gi, ii, 'value', v || null)}
                            >
                              <SelectTrigger className="h-6 w-36 border-slate-200 px-1.5 text-xs">
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {ref.options.map((o) => (
                                  <SelectItem key={o.value} value={o.value} className="text-xs">
                                    {o.labelKo ?? o.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : testType === 'multiselect' && ref?.options ? (
                            <div className="flex flex-col gap-0.5">
                              {ref.options.map((o) => {
                                const selected = item.value?.split(',').map((v) => v.trim()) ?? []
                                const checked = selected.includes(o.value)
                                return (
                                  <label key={o.value} className="flex items-center gap-1 text-xs">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(v) => {
                                        const next = v
                                          ? [...selected, o.value]
                                          : selected.filter((s) => s !== o.value)
                                        updateLabItem(gi, ii, 'value', next.length ? next.join(',') : null)
                                      }}
                                      className="h-3 w-3"
                                    />
                                    <span className={o.isAbnormal ? 'text-red-600' : 'text-slate-700'}>
                                      {o.labelKo ?? o.value}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          ) : (
                            <Input
                              value={item.value ?? ''}
                              onChange={(e) => updateLabItem(gi, ii, 'value', e.target.value || null)}
                              className="h-6 w-24 border-slate-200 px-1.5 text-xs"
                              placeholder="—"
                            />
                          )}
                        </td>
                        <td className="py-0.5 pr-3 text-slate-400">{item.unit}</td>
                        <td className="py-0.5 pr-3">
                          {testType === 'range' ? (
                            <Input
                              value={item.ref_range ?? ''}
                              onChange={(e) => updateLabItem(gi, ii, 'ref_range', e.target.value || null)}
                              className="h-6 w-28 border-slate-200 px-1.5 text-xs"
                              placeholder="기기 참고범위"
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-0.5">
                          {item.result_text ? (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                item.severity
                                  ? SEVERITY_BADGE[item.severity]
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {item.result_text}
                            </span>
                          ) : item.is_abnormal ? (
                            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              이상
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                      {item.is_abnormal && (
                        <tr>
                          <td colSpan={5} className="pb-1.5 pt-0">
                            <Input
                              value={item.comment ?? ''}
                              onChange={(e) => updateLabItem(gi, ii, 'comment', e.target.value || null)}
                              className="h-6 w-full border-orange-200 bg-orange-50 px-2 text-xs text-orange-800 placeholder:text-orange-300"
                              placeholder="이상 소견 코멘트 (자동 입력, 수정 가능)"
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}

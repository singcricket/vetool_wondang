'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { FlaskConical, Microscope } from 'lucide-react'
import { SectionBlock } from './tab-ui'
import { Input } from '@/components/ui/input'
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
  labRefBloodGas,
  labRefCoagulation,
  labRefMap,
  type LabRefItem,
  type LabResultItem,
  type LabSection,
  type LabSeverity,
} from '@/constants/hospital/checkup/lab-ref'
import { evaluateLabValue, getAutoComment, getDefaultRefRange } from '@/lib/utils/lab-evaluate'
import type { ExtractedLabRaw } from '@/lib/actions/checkup/pdf-extraction'

export interface Tab3Ref {
  save: () => Promise<void>
  refresh: (data: Record<string, unknown>) => void
}

interface Props {
  checkupId: string
  patient: CheckupPatient
  labSection: CheckupSection | undefined
  extractedLabItems: LabResultItem[] | null
  extractedUnmatchedItems: ExtractedLabRaw[] | null
  onDirty?: () => void
}

const SEVERITY_BADGE: Record<LabSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  moderate: 'bg-yellow-400 text-slate-800',
  mild:     'bg-slate-200 text-slate-700',
}

type SectionColor = 'red' | 'orange' | 'teal' | 'amber' | 'sky' | 'purple' | 'slate'

const LAB_GROUPS: { label: string; section: LabSection; items: LabRefItem[]; color: SectionColor }[] = [
  { label: 'CBC (혈액검사)', section: 'cbc',         items: labRefCbc,         color: 'red'    },
  { label: '혈청화학',       section: 'chemistry',   items: labRefChemistry,   color: 'orange' },
  { label: '내분비',         section: 'endocrine',   items: labRefEndocrine,   color: 'teal'   },
  { label: '요검사',         section: 'urinalysis',  items: labRefUrinalysis,  color: 'amber'  },
  { label: '혈액가스검사',   section: 'blood_gas',   items: labRefBloodGas,    color: 'sky'    },
  { label: '응고계 검사',    section: 'coagulation', items: labRefCoagulation, color: 'purple' },
  { label: '특수검사',       section: 'special',     items: labRefSpecial,     color: 'slate'  },
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
    source: existingMap[ref.id]?.source,
    section: ref.section,
  }))
}

function toUnmatchedItem(raw: ExtractedLabRaw): LabResultItem {
  const id = `unmatched_${raw.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
  return {
    id,
    nameEn: raw.nameEn,
    nameKo: raw.nameEn,
    unit: raw.unit ?? '',
    value: raw.value || null,
    ref_range: raw.ref_range || null,
    is_abnormal: raw.is_abnormal ?? null,
    result_text: null,
    severity: null,
    comment: null,
    section: ['special'],
    source: 'ai',
    include_in_report: true,
    target_section: null,
  }
}

const UNMATCHED_SECTION_OPTIONS: { value: LabSection | 'none'; label: string }[] = [
  { value: 'none',        label: '기타 (미분류)' },
  { value: 'cbc',         label: 'CBC (혈액검사)' },
  { value: 'chemistry',   label: '혈청화학' },
  { value: 'endocrine',   label: '내분비' },
  { value: 'urinalysis',  label: '요검사' },
  { value: 'blood_gas',   label: '혈액가스검사' },
  { value: 'coagulation', label: '응고계 검사' },
  { value: 'special',     label: '특수검사' },
]

const Tab3Lab = forwardRef<Tab3Ref, Props>(function Tab3Lab({ checkupId, patient, labSection, extractedLabItems, extractedUnmatchedItems, onDirty }, ref) {
  const savedLabItems = ((labSection?.data as any)?.items ?? []) as LabResultItem[]
  // 저장된 항목 중 ref가 없는 항목은 미분류로 분리
  const savedLabMap: Record<string, LabResultItem> = Object.fromEntries(
    savedLabItems.filter((item) => labRefMap[item.id]).map((item) => [item.id, item]),
  )

  const species = patient.species ?? ''
  const [labGroups, setLabGroups] = useState(() =>
    LAB_GROUPS.map((g) => ({
      ...g,
      results: initLabItems(g.items, savedLabMap, species),
    })),
  )
  const savedUnmatched = savedLabItems.filter((item) => !labRefMap[item.id])
  const [unmatchedItems, setUnmatchedItems] = useState<LabResultItem[]>(savedUnmatched)
  const [, setSaving] = useState(false)

  const mountedRef = useRef(false)
  const refreshingRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) return
    if (refreshingRef.current) { refreshingRef.current = false; return }
    onDirty?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labGroups, unmatchedItems])
  useEffect(() => { mountedRef.current = true }, [])

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

          const isNew = r.value === null && extracted.value !== null
          const valueFromAi = isNew ? extracted.value : r.value
          const refRange = extracted.ref_range || r.ref_range
          const stateSource = isNew ? ('ai' as const) : r.source

          const ref = labRefMap[r.id]
          const evaled = ref && valueFromAi
            ? evaluateLabValue(valueFromAi, ref, species, stateSource, refRange)
            : null

          return {
            ...r,
            value: valueFromAi,
            ref_range: refRange,
            source: stateSource,
            is_abnormal: evaled ? evaled.isAbnormal : (r.is_abnormal ?? extracted.is_abnormal),
            result_text: evaled ? evaled.resultTextKo : r.result_text,
            severity: evaled ? evaled.severity : r.severity,
            comment: evaled?.isAbnormal && !r.comment && ref
              ? getAutoComment(ref, evaled.direction)
              : r.comment,
          }
        }),
      })),
    )
  }, [extractedLabItems])

  useEffect(() => {
    if (!extractedUnmatchedItems || extractedUnmatchedItems.length === 0) return
    setUnmatchedItems((prev) => {
      const newItems = extractedUnmatchedItems
        .map(toUnmatchedItem)
        .filter((item) => !prev.some((p) => p.id === item.id))
      return [...prev, ...newItems]
    })
  }, [extractedUnmatchedItems])

  const updateUnmatchedItem = (
    idx: number,
    field: 'value' | 'ref_range' | 'is_abnormal' | 'comment' | 'include_in_report' | 'target_section',
    val: string | boolean | null,
  ) => {
    setUnmatchedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
    )
  }

  const removeUnmatchedItem = (idx: number) => {
    setUnmatchedItems((prev) => prev.filter((_, i) => i !== idx))
  }

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
                    r.ref_range,
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
      const matchedItems = labGroups.flatMap((g) =>
        g.results.filter((r) => r.value !== null && r.value !== ''),
      )
      await upsertCheckupSection({
        checkupId,
        sectionType: 'lab',
        data: { items: [...matchedItems, ...unmatchedItems] },
      })
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({
    save: handleSave,
    refresh: (data: Record<string, unknown>) => {
      const items = ((data.items ?? []) as LabResultItem[])
      const newLabMap: Record<string, LabResultItem> = Object.fromEntries(
        items.filter((item) => labRefMap[item.id]).map((item) => [item.id, item]),
      )
      refreshingRef.current = true
      setLabGroups((prev) =>
        prev.map((g) => ({
          ...g,
          results: initLabItems(g.items, newLabMap, species),
        })),
      )
      setUnmatchedItems(items.filter((item) => !labRefMap[item.id]))
    },
  }))

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-slate-400">값이 입력된 항목만 저장됩니다.</p>

      {labGroups.map((group, gi) => (
        <SectionBlock key={group.section} icon={FlaskConical} title={group.label} color={group.color}>
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
        </SectionBlock>
      ))}

      {unmatchedItems.length > 0 && (
        <SectionBlock icon={Microscope} title="기타 (미분류 검사) — AI 추출 항목" color="amber">
          <p className="mb-2 text-[11px] text-slate-400">
            리포트 포함 여부, 섹션 배치, 코멘트를 설정할 수 있습니다.
          </p>
          <div className="flex flex-col gap-2">
            {unmatchedItems.map((item, idx) => {
              const excluded = item.include_in_report === false
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 transition-colors ${excluded ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-amber-100 bg-white'}`}
                >
                  <div className="flex flex-wrap items-start gap-2">
                    {/* 포함/제외 토글 */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Checkbox
                        checked={item.include_in_report !== false}
                        onCheckedChange={(v) => updateUnmatchedItem(idx, 'include_in_report', !!v)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-[10px] text-slate-500">리포트 포함</span>
                    </div>

                    {/* 항목명 */}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-800">{item.nameEn}</span>
                      {item.unit && <span className="ml-1 text-[10px] text-slate-400">({item.unit})</span>}
                    </div>

                    {/* 섹션 배치 */}
                    <Select
                      value={item.target_section ?? 'none'}
                      onValueChange={(v) => updateUnmatchedItem(idx, 'target_section', v === 'none' ? null : v)}
                    >
                      <SelectTrigger className="h-6 w-36 border-amber-200 px-1.5 text-[11px]">
                        <SelectValue placeholder="섹션 배치" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNMATCHED_SECTION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => removeUnmatchedItem(idx)}
                      className="rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                    >
                      <span className="text-[11px]">✕</span>
                    </button>
                  </div>

                  {/* 측정값 / 참고범위 / 이상여부 */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">측정값</span>
                      <Input
                        value={item.value ?? ''}
                        onChange={(e) => updateUnmatchedItem(idx, 'value', e.target.value || null)}
                        className="h-6 w-20 border-slate-200 px-1.5 text-xs"
                        placeholder="—"
                        disabled={excluded}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">참고범위</span>
                      <Input
                        value={item.ref_range ?? ''}
                        onChange={(e) => updateUnmatchedItem(idx, 'ref_range', e.target.value || null)}
                        className="h-6 w-24 border-slate-200 px-1.5 text-xs"
                        placeholder="참고범위"
                        disabled={excluded}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">이상여부</span>
                      <Select
                        value={item.is_abnormal === true ? 'true' : item.is_abnormal === false ? 'false' : 'unknown'}
                        onValueChange={(v) =>
                          updateUnmatchedItem(idx, 'is_abnormal', v === 'true' ? true : v === 'false' ? false : null)
                        }
                        disabled={excluded}
                      >
                        <SelectTrigger className="h-6 w-20 border-slate-200 px-1.5 text-[11px]">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown" className="text-xs">—</SelectItem>
                          <SelectItem value="false" className="text-xs">정상</SelectItem>
                          <SelectItem value="true" className="text-xs">이상</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 코멘트 */}
                  <div className="mt-1.5">
                    <Input
                      value={item.comment ?? ''}
                      onChange={(e) => updateUnmatchedItem(idx, 'comment', e.target.value || null)}
                      className="h-6 w-full border-slate-200 px-2 text-xs placeholder:text-slate-300"
                      placeholder="코멘트 입력 (선택)"
                      disabled={excluded}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionBlock>
      )}

        </div>
      </div>
    </div>
  )
})

export default Tab3Lab

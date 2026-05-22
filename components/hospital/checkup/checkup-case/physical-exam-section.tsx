'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  physicalRefAll,
  PHYSICAL_SECTION_ORDER,
  PHYSICAL_SECTION_LABEL,
  type PhysicalSection,
} from '@/constants/hospital/checkup/physical-ref'

export type PhysicalValues = Record<string, string>

// 섹션 상태 키 헬퍼
export const sectionStatusKey = (section: PhysicalSection) => `__sec__${section}`

type SectionStatus = 'normal' | 'abnormal' | ''

interface Props {
  values: PhysicalValues
  onChange: (id: string, value: string) => void
}

export default function PhysicalExamSection({ values, onChange }: Props) {
  const getStatus = (section: PhysicalSection): SectionStatus =>
    (values[sectionStatusKey(section)] ?? '') as SectionStatus

  const setStatus = (section: PhysicalSection, next: SectionStatus) => {
    const key = sectionStatusKey(section)
    const current = getStatus(section)
    // 같은 버튼 재클릭 → 해제
    onChange(key, current === next ? '' : next)
  }

  return (
    <div className="flex flex-col gap-4">
      {PHYSICAL_SECTION_ORDER.map((section) => {
        const items = physicalRefAll.filter((item) => item.section === section)
        const status = getStatus(section)
        const showItems = status !== 'normal'

        return (
          <div key={section}>
            {/* 섹션 헤더 */}
            <div className="mb-2 flex items-center justify-between rounded bg-slate-50 px-2 py-1">
              <p className="text-xs font-semibold text-slate-600">
                {PHYSICAL_SECTION_LABEL[section]}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setStatus(section, 'normal')}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    status === 'normal'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-400 ring-1 ring-slate-200 hover:ring-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  정상
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(section, 'abnormal')}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    status === 'abnormal'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-slate-400 ring-1 ring-slate-200 hover:ring-red-300 hover:text-red-500'
                  }`}
                >
                  이상
                </button>
              </div>
            </div>

            {/* 세부 항목 — normal 선택 시 숨김 */}
            {showItems && (
              <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <label className="text-xs font-medium text-slate-700">
                        {item.nameKo}
                        {item.unit && (
                          <span className="ml-1 font-normal text-slate-400">({item.unit})</span>
                        )}
                      </label>
                      {item.referenceRange && (
                        <span className="text-[10px] text-slate-400">
                          기준:{' '}
                          {item.referenceRange.common ??
                            `개 ${item.referenceRange.dog} / 고양이 ${item.referenceRange.cat}`}
                        </span>
                      )}
                    </div>

                    {item.inputType === 'number' && (
                      <Input
                        type="number"
                        value={values[item.id] ?? ''}
                        onChange={(e) => onChange(item.id, e.target.value)}
                        className="h-7 text-sm"
                        placeholder="—"
                      />
                    )}

                    {item.inputType === 'select' && item.options && (
                      <Select
                        value={values[item.id] ?? ''}
                        onValueChange={(v) => onChange(item.id, v)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.options.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {item.inputType === 'multiselect' && item.options && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                        {item.options.map((opt) => {
                          const selected = (values[item.id] ?? '')
                            .split(',')
                            .map((v) => v.trim())
                            .filter(Boolean)
                          const checked = selected.includes(opt)
                          const toggle = () => {
                            const next = checked
                              ? selected.filter((v) => v !== opt)
                              : [...selected, opt]
                            onChange(item.id, next.join(','))
                          }
                          return (
                            <label
                              key={opt}
                              className="flex cursor-pointer items-center gap-1 text-xs text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={toggle}
                                className="h-3.5 w-3.5 accent-teal-600"
                              />
                              {opt}
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {item.inputType === 'text' && (
                      <Input
                        value={values[item.id] ?? ''}
                        onChange={(e) => onChange(item.id, e.target.value)}
                        className="h-7 text-sm"
                        placeholder="직접 입력"
                      />
                    )}

                    {item.comment && (
                      <p className="text-[10px] leading-tight text-slate-400">{item.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

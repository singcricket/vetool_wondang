'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/utils'
import { AUDIENCE_LABEL, AUDIENCE_COLOR, type BlogSection, type SectionAudience } from '@/types/hospital/blog-type'

interface Props {
  sections: BlogSection[]
  onChange: (sections: BlogSection[]) => void
}

const DEFAULT_SECTION_TITLES = [
  '증상 및 내원 경위',
  '신체검사 및 진단 과정',
  '치료',
  '경과 및 퇴원',
  '질병 안내',
]

const AUDIENCES: SectionAudience[] = ['both', 'vet', 'owner']

export default function BlogSectionEditor({ sections, onChange }: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const addSection = (title = '') => {
    const newSection: BlogSection = { type: 'section', title, body: '', audience: 'both' }
    onChange([...sections, newSection])
  }

  const updateSection = (idx: number, patch: Partial<Extract<BlogSection, { type: 'section' | 'disease_info' }>>) => {
    onChange(sections.map((s, i) => (i === idx ? { ...s, ...patch } as BlogSection : s)))
  }

  const removeSection = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx))
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(idx)
      return next
    })
  }

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...sections]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  const toggleCollapse = (idx: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {sections.map((section, idx) => {
        if (section.type !== 'section' && section.type !== 'disease_info') return null
        const isCollapsed = collapsed.has(idx)
        const isDiseaseInfo = section.type === 'disease_info'
        const currentAudience: SectionAudience = section.audience ?? 'both'

        return (
          <div
            key={idx}
            className={cn(
              'rounded-lg border',
              isDiseaseInfo ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white',
            )}
          >
            {/* 섹션 헤더 */}
            <div className="flex items-center gap-1 px-3 py-2">
              <GripVertical size={14} className="shrink-0 text-slate-300" />
              <Input
                value={section.title}
                onChange={(e) => updateSection(idx, { title: e.target.value })}
                placeholder="섹션 제목"
                className={cn(
                  'h-7 flex-1 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0',
                  isDiseaseInfo && 'text-blue-700',
                )}
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                  className="rounded p-1 text-slate-300 hover:text-slate-500 disabled:opacity-30">
                  <ChevronUp size={13} />
                </button>
                <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                  className="rounded p-1 text-slate-300 hover:text-slate-500 disabled:opacity-30">
                  <ChevronDown size={13} />
                </button>
                <button type="button" onClick={() => toggleCollapse(idx)}
                  className="rounded p-1 text-slate-300 hover:text-slate-500">
                  {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
                <button type="button" onClick={() => removeSection(idx)}
                  className="rounded p-1 text-slate-300 hover:text-rose-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* 대상 독자 토글 */}
            <div className="flex gap-1 px-3 pb-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateSection(idx, { audience: a })}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                    currentAudience === a
                      ? AUDIENCE_COLOR[a]
                      : 'border-transparent bg-transparent text-slate-300 hover:text-slate-400',
                  )}
                >
                  {AUDIENCE_LABEL[a]}
                </button>
              ))}
            </div>

            {/* 본문 */}
            {!isCollapsed && (
              <div className="px-3 pb-3">
                <textarea
                  value={section.body}
                  onChange={(e) => updateSection(idx, { body: e.target.value })}
                  placeholder="내용을 입력하세요..."
                  rows={5}
                  className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        )
      })}

      {/* 섹션 추가 버튼 */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_SECTION_TITLES.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                if (title === '질병 안내') {
                  onChange([...sections, { type: 'disease_info', title: '질병 안내', body: '', audience: 'owner' }])
                } else {
                  addSection(title)
                }
              }}
              className="rounded-full border border-dashed border-slate-300 px-3 py-0.5 text-[11px] text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
            >
              + {title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addSection()}
            className="flex items-center gap-0.5 rounded-full border border-dashed border-slate-300 px-3 py-0.5 text-[11px] text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
          >
            <Plus size={11} /> 직접 입력
          </button>
        </div>
      </div>
    </div>
  )
}

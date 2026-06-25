'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/utils'
import { X } from 'lucide-react'
import Autocomplete from '@/components/common/auto-complete/auto-complete'
import BlogPatientDialog from './blog-patient-dialog'
import { BLOG_CATEGORIES, SPECIES_LABEL, type BlogPostFormInput, type BlogPatient, type BlogSpecies } from '@/types/hospital/blog-type'

interface Props {
  value: BlogPostFormInput
  onChange: (patch: Partial<BlogPostFormInput>) => void
  postId: string | null
  patient: BlogPatient | null
  onPatientChange: (patient: BlogPatient | null) => void
  hosId: string
}

function parseTags(raw: string): string[] {
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

function parseCategories(raw: string): string[] {
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

export default function BlogMetaForm({ value, onChange, postId, patient, onPatientChange, hosId }: Props) {
  const tags = parseTags(value.user_tags)
  const selectedCategories = parseCategories(value.case_category)

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    onChange({ case_category: next.join(',') })
  }

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag).join(', ')
    onChange({ user_tags: next })
  }

  return (
    <div className="space-y-4">
      {/* 환자 연결 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">환자</label>
        <BlogPatientDialog
          hosId={hosId}
          postId={postId}
          patient={patient}
          onPatientChange={onPatientChange}
        />
      </div>

      {/* 제목 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">제목 *</label>
        <Input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="케이스 제목을 입력하세요"
          className="text-sm"
        />
      </div>

      {/* 카테고리 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">진료 분야 *</label>
          {selectedCategories.length > 0 && (
            <span className="text-[10px] text-slate-400">
              {selectedCategories.join(', ')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={cn(
                'rounded-full border px-3 py-0.5 text-xs transition-colors',
                selectedCategories.includes(cat)
                  ? 'border-teal-500 bg-teal-50 font-semibold text-teal-700'
                  : 'border-slate-200 text-slate-500 hover:border-teal-300',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 진단명 + 종 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">진단명</label>
          <Input
            value={value.diagnosis}
            onChange={(e) => onChange({ diagnosis: e.target.value })}
            placeholder="예: 췌장염"
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">종</label>
          <div className="flex gap-1.5">
            {(Object.entries(SPECIES_LABEL) as [BlogSpecies, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ species: key })}
                className={cn(
                  'flex-1 rounded-md border py-1.5 text-xs transition-colors',
                  value.species === key
                    ? 'border-teal-500 bg-teal-50 font-semibold text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-teal-300',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 한줄 요약 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">한줄 요약</label>
        <Input
          value={value.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="목록에 표시될 짧은 설명"
          className="text-sm"
        />
      </div>

      {/* 추가 사항 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">추가 사항</label>
        <Textarea
          value={value.extra_notes}
          onChange={(e) => onChange({ extra_notes: e.target.value })}
          placeholder={"AI 분석 시 더 자세히 다룰 내용을 입력하세요\n예) 프레드니솔론 1mg/kg 2주 투여 경과, 슬개골 탈구 수술 과정 상세히"}
          className="min-h-[80px] resize-none text-xs"
        />
        <p className="text-[11px] text-slate-400">입력 시 AI가 해당 주제에 대한 별도 섹션을 생성합니다</p>
      </div>

      {/* 태그 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">태그</label>
        <Autocomplete
          defaultValue={value.user_tags}
          handleUpdate={(v) => onChange({ user_tags: v })}
          placeholder="쉼표로 구분, 자동완성 지원"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-0.5 rounded-full bg-slate-100 pl-2.5 pr-1.5 py-0.5 text-xs text-slate-600"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full p-0.5 hover:bg-slate-200"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

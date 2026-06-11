'use client'

import {
  CHECKUP_IMAGE_TAG_GROUPS,
  TAG_COLOR_CLASS,
  getTagColor,
  type CheckupImageTagGroup,
} from '@/constants/hospital/checkup/checkup-image-tags'

interface Props {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  /** 동적으로 추가되는 태그 그룹 (예: 피부 병변별 태그) */
  dynamicGroups?: CheckupImageTagGroup[]
}

export default function CheckupImageTagSelector({ selectedTags, onChange, dynamicGroups }: Props) {
  const toggle = (id: string) => {
    onChange(
      selectedTags.includes(id)
        ? selectedTags.filter((t) => t !== id)
        : [...selectedTags, id],
    )
  }

  const allGroups = dynamicGroups ? [...CHECKUP_IMAGE_TAG_GROUPS, ...dynamicGroups] : CHECKUP_IMAGE_TAG_GROUPS

  return (
    <div className="flex flex-col gap-3">
      {allGroups.map((group) => (
        <div key={group.group}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.tags.map((tag) => {
              const active = selectedTags.includes(tag.id)
              const colorClass = TAG_COLOR_CLASS[getTagColor(tag.id)] ?? TAG_COLOR_CLASS[group.color] ?? TAG_COLOR_CLASS.slate
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                    active
                      ? `${colorClass} border-transparent shadow-sm`
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {/* 시각적 체크 인디케이터 — <button> 중첩 방지 */}
                  <span
                    className={`flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-sm border ${
                      active ? 'border-current bg-current/30' : 'border-slate-300'
                    }`}
                  >
                    {active && (
                      <svg viewBox="0 0 10 10" className="h-1.5 w-1.5 fill-current">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

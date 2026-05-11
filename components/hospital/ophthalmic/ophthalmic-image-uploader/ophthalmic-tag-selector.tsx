'use client'

import React from 'react'
import { cn } from '@/lib/utils/utils'

export const OPHTHALMIC_IMAGE_TAGS = [
  { id: 'External', ko: '육안적', en: 'External' },
  { id: 'Cornea', ko: '각막', en: 'Cornea' },
  { id: 'Anterior Chamber', ko: '전안방', en: 'Anterior Chamber' },
  { id: 'Iris', ko: '홍채', en: 'Iris' },
  { id: 'Lens', ko: '수정체', en: 'Lens' },
  { id: 'Fundus', ko: '안저', en: 'Fundus' },
  { id: 'Ultrasound', ko: '초음파', en: 'Ultrasound' },
]

export const OPHTHALMIC_SIDES = [
  { id: 'OD', ko: '우안', en: 'OD' },
  { id: 'OS', ko: '좌안', en: 'OS' },
  { id: 'OU', ko: '양안', en: 'OU' },
]

interface Props {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  selectedSide: string
  onSideChange: (side: string) => void
}

export default function OphthalmicTagSelector({ 
  selectedTags, 
  onTagsChange, 
  selectedSide, 
  onSideChange 
}: Props) {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(t => t !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  return (
    <div className="space-y-6">
      {/* Side Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">방향 (Side)</label>
        <div className="grid grid-cols-3 gap-2">
          {OPHTHALMIC_SIDES.map((side) => (
            <button
              key={side.id}
              onClick={() => onSideChange(side.id)}
              className={cn(
                "py-2 rounded-lg border text-xs font-black transition-all shadow-sm",
                selectedSide === side.id
                  ? "bg-rose-600 border-rose-600 text-white ring-2 ring-rose-100"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {side.ko} ({side.en})
            </button>
          ))}
        </div>
      </div>

      {/* Tag Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">부위 태그 (Tags)</label>
        <div className="flex flex-wrap gap-2">
          {OPHTHALMIC_IMAGE_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                "px-4 py-2.5 rounded-lg border text-xs font-black transition-all shadow-sm flex flex-col items-center gap-0.5",
                selectedTags.includes(tag.id)
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="uppercase tracking-tight">{tag.en}</span>
              <span className="text-[9px] opacity-60 font-bold">{tag.ko}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

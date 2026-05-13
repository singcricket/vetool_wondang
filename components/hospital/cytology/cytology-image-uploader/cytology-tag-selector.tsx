'use client'

import React from 'react'
import { cn } from '@/lib/utils/utils'

export const CYTOLOGY_IMAGE_TAGS = [
  { id: 'otic', ko: '귀도말', en: 'Otic' },
  { id: 'skin_impression', ko: '피부인상도말', en: 'Skin Impression' },
  { id: 'skin_exudate', ko: '피부삼출물', en: 'Skin Exudate' },
  { id: 'fecal', ko: '분변염색', en: 'Fecal' },
  { id: 'vaginal', ko: '질세포진', en: 'Vaginal' },
  { id: 'conjunctival', ko: '결막도말', en: 'Conjunctival' },
  { id: 'fna_skin', ko: 'FNA-피부', en: 'FNA Skin' },
  { id: 'fna_lymph', ko: 'FNA-림프절', en: 'FNA Lymph' },
  { id: 'fna_organ', ko: 'FNA-장기', en: 'FNA Organ' },
  { id: 'effusion', ko: '체강액', en: 'Effusion' },
  { id: 'synovial', ko: '관절액', en: 'Synovial' },
  { id: 'csf', ko: '뇌척수액', en: 'CSF' },
  { id: 'bal', ko: 'BAL', en: 'BAL' },
]

interface Props {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function CytologyTagSelector({ 
  selectedTags, 
  onTagsChange 
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
      {/* Tag Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">검체 타입 태그 (Sample Type Tags)</label>
        <div className="flex flex-wrap gap-2">
          {CYTOLOGY_IMAGE_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                "px-4 py-2.5 rounded-lg border text-xs font-black transition-all shadow-sm flex flex-col items-center gap-0.5",
                selectedTags.includes(tag.id)
                  ? "bg-violet-600 border-violet-600 text-white"
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

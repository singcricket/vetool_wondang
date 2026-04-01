'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { EchoTestUIMeta, EchoResultMap } from '@/types/echocardio/echocardio-type'
import EchoInputField from './echo-input-field'

interface EchoSectionWrapperProps {
  sectionLabel: string
  items: EchoTestUIMeta[]
  resultMap: EchoResultMap
  computedResults: Record<string, { result: string; comment: string }>
  mmodeRefs: Record<string, [number, number] | null>
  onItemChange: (keywordId: string, value: string) => void
}

export default function EchoSectionWrapper({
  sectionLabel,
  items,
  resultMap,
  computedResults,
  mmodeRefs,
  onItemChange,
}: EchoSectionWrapperProps) {
  const [isOpen, setIsOpen] = useState(true)

  // 그룹별 묶기 (한 항목이 여러 그룹에 속할 수 있음)
  const groupMap: Record<string, EchoTestUIMeta[]> = {}
  items.forEach((item) => {
    item.groups.forEach((g) => {
      if (!groupMap[g]) groupMap[g] = []
      groupMap[g].push(item)
    })
  })

  return (
    <div className="rounded-md border bg-white">
      {/* 섹션 헤더 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/50"
      >
        <span className="text-xs font-bold">{sectionLabel}</span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t px-3 py-2">
          {Object.entries(groupMap).map(([group, groupItems]) => (
            <div key={group} className="mb-3 last:mb-0">
              {/* 그룹명 (Comment, PE 등 단일 그룹은 숨김) */}
              {group !== 'PE' && group !== 'Comment' && group !== 'Thorax' && (
                <div className="mb-1.5 border-b pb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {groupItems.map((item) => (
                  <EchoInputField
                    key={item.keywordID}
                    item={item}
                    value={resultMap[item.keywordID] ?? ''}
                    computed={computedResults[item.keywordID]}
                    mmodeRef={mmodeRefs[item.keywordID] ?? undefined}
                    onChange={onItemChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

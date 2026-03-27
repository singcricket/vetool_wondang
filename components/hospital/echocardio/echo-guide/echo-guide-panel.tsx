'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { EchoGuideImage } from '@/types/echocardio/echocardio-type'

interface EchoGuidePanelProps {
  images: EchoGuideImage[]
  highlightedKeywords: string[]
}

export default function EchoGuidePanel({
  images,
  highlightedKeywords,
}: EchoGuidePanelProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const current = images[activeIndex]

  if (!current) return null

  // 현재 이미지에서 측정해야 하는 항목 중 아직 값이 없는 항목
  const pendingKeywords = current.mapped_keywords.filter(
    (kw) => !highlightedKeywords.includes(kw),
  )

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold text-muted-foreground">
        가이드 이미지
      </span>

      {/* 이미지 탭 */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                i === activeIndex
                  ? 'bg-black text-white'
                  : 'border hover:bg-muted'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 뷰 이름 */}
      <p className="text-[10px] font-medium">{current.view_name}</p>

      {/* 이미지 */}
      <div className="relative aspect-square w-full overflow-hidden rounded border bg-muted">
        <Image
          src={current.image_url}
          alt={current.view_name}
          fill
          className="object-contain"
          sizes="256px"
        />
      </div>

      {/* 측정 항목 목록 */}
      {current.mapped_keywords.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold uppercase text-muted-foreground">
            측정 항목
          </span>
          {current.mapped_keywords.map((kw) => {
            const isDone = highlightedKeywords.includes(kw)
            return (
              <div key={kw} className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isDone ? 'bg-green-500' : 'bg-orange-400'
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    isDone ? 'text-muted-foreground line-through' : ''
                  }`}
                >
                  {kw}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

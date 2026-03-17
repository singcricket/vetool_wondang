'use client'

import { useState } from "react"
import { format } from "date-fns"
import { MsMemo } from "@/types/monitoring/monitoring-type"
import MsMemoImageGallery from "@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-gallery"
import { cn } from "@/lib/utils/utils"

type Props = {
  memo: MsMemo
  startTime: string | null
}

export default function MsMonitorMemoItem({ memo, startTime }: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const diffMinutes = (startTime && memo.done_timestamp)
    ? Math.floor((new Date(memo.done_timestamp).getTime() - new Date(startTime).getTime()) / 60000)
    : null

  const diffText = diffMinutes !== null
    ? diffMinutes === 0
      ? '(시작)'
      : diffMinutes > 0
        ? `(시작 후 ${diffMinutes}분)`
        : `(시작 전 ${Math.abs(diffMinutes)}분)`
    : ''

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border-l-4 shadow-sm transition-all hover:bg-muted/10",
        memo.is_done ? "bg-muted/5" : "bg-amber-50/50 ring-1 ring-amber-200"
      )}
      style={{ borderLeftColor: memo.color || 'gray' }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
          <span>
            {memo.done_timestamp 
              ? format(new Date(memo.done_timestamp), 'HH:mm:ss')
              : '진행전'
            }
          </span>
          {memo.is_done && diffText && (
            <span className="text-primary font-bold">{diffText}</span>
          )}
        </div>
        {memo.is_done && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">DONE</span>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{memo.memo}</p>
      
      {memo.has_imgs && memo.img_url && memo.img_url.length > 0 && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {memo.img_url.map((url, i) => (
              <div 
                key={i} 
                className="h-24 w-24 cursor-pointer rounded-md overflow-hidden border transition-all hover:ring-2 hover:ring-primary/50 grayscale-[0.2] hover:grayscale-0"
                onClick={() => {
                  setSelectedImageIndex(i)
                  setIsGalleryOpen(true)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="memo" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          <MsMemoImageGallery
            imgUrls={memo.img_url}
            isGalleryOpen={isGalleryOpen}
            setIsGalleryOpen={setIsGalleryOpen}
            selectedImageIndex={selectedImageIndex}
          />
        </>
      )}
    </div>
  )
}

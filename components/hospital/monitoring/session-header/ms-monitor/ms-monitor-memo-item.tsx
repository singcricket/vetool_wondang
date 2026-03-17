'use client'

import { useState } from "react"
import { format } from "date-fns"
import { MsMemo } from "@/types/monitoring/monitoring-type"
import MsMemoImageGallery from "@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-gallery"

type Props = {
  memo: MsMemo
}

export default function MsMonitorMemoItem({ memo }: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  return (
    <div 
      className="p-4 rounded-lg border-l-4 shadow-sm bg-muted/5 transition-all hover:bg-muted/10"
      style={{ borderLeftColor: memo.color || 'gray' }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] text-muted-foreground font-mono">
          {format(new Date(memo.create_timestamp), 'HH:mm:ss')}
        </span>
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

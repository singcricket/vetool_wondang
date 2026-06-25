'use client'

import { useRef } from 'react'
import { Download } from 'lucide-react'
import BlogImageWithMark from './blog-image-with-mark'
import type { BlogImage } from '@/types/hospital/blog-type'
import { parseBlogImageCaption } from '@/lib/utils/blog-image-caption'

interface Props {
  img: BlogImage
}

export default function BlogImageCard({ img }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { description } = parseBlogImageCaption(img.caption)

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })
      const link = document.createElement('a')
      link.download = `image_${img.id.slice(0, 8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      /* 조용히 실패 */
    }
  }

  return (
    <div className="group relative space-y-1">
      {/* 캡처 대상 영역 */}
      <div ref={cardRef} className="bg-white">
        <BlogImageWithMark
          imageUrl={img.image_url}
          caption={img.caption}
          alt={description ?? ''}
          className="rounded-lg border border-slate-200 aspect-video"
        />
        {description && (
          <p className="whitespace-pre-wrap px-1 py-1 text-center text-[11px] leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>

      {/* 호버 시 다운로드 버튼 */}
      <button
        type="button"
        onClick={handleDownload}
        className="absolute right-1 top-1 hidden items-center gap-1 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 shadow hover:bg-slate-100 group-hover:flex"
        title="PNG로 저장"
      >
        <Download size={11} />
        PNG
      </button>
    </div>
  )
}

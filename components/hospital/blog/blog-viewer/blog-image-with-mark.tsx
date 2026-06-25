'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/utils'
import Image from 'next/image'
import { parseBlogImageCaption } from '@/lib/utils/blog-image-caption'

interface Props {
  imageUrl: string
  caption?: string | null
  className?: string
  alt?: string
}

export default function BlogImageWithMark({ imageUrl, caption, className, alt = '' }: Props) {
  const [combinedUrl, setCombinedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { isMark: hasMark, markJson, grayscale } = parseBlogImageCaption(caption)

  useEffect(() => {
    if (!hasMark || !markJson) { setLoading(false); return }
    const caption = markJson
    let isMounted = true

    async function render() {
      try {
        const { fabric } = await import('fabric')
        const parsed = JSON.parse(caption!)
        const origW = parsed.origWidth || 1000
        const origH = parsed.origHeight || 800

        const el = document.createElement('canvas')
        const fCanvas = new fabric.StaticCanvas(el, { width: origW, height: origH })

        fCanvas.loadFromJSON(caption!, () => {
          if (!isMounted) return
          fabric.Image.fromURL(
            imageUrl,
            (img) => {
              if (!isMounted) return
              const canvasAspect = origW / origH
              const imgAspect = img.width! / img.height!
              const scale = canvasAspect >= imgAspect ? origH / img.height! : origW / img.width!
              img.set({ originX: 'center', originY: 'center', left: origW / 2, top: origH / 2, scaleX: scale, scaleY: scale })

              fCanvas.setBackgroundImage(img, () => {
                fCanvas.renderAll()
                const iW = img.width! * scale
                const iH = img.height! * scale
                const startX = (origW - iW) / 2
                const startY = (origH - iH) / 2
                try {
                  const dataURL = fCanvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: 2, left: startX, top: startY, width: iW, height: iH })
                  if (isMounted) setCombinedUrl(dataURL)
                } catch { /* CORS fallback */ }
                if (isMounted) setLoading(false)
                fCanvas.dispose()
              })
            },
            { crossOrigin: 'anonymous' },
          )
        })
      } catch {
        if (isMounted) setLoading(false)
      }
    }

    render()
    return () => { isMounted = false }
  }, [imageUrl, markJson, hasMark])

  const grayStyle = grayscale ? { filter: 'grayscale(1)' } : undefined

  if (!hasMark) {
    return (
      <div className={cn('overflow-hidden', className)} style={grayStyle}>
        <Image src={imageUrl} alt={alt} width={600} height={400} className="w-full h-full object-cover" unoptimized />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-slate-50', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 bg-slate-50">
          마킹 로드 중...
        </div>
      )}
      {!loading && combinedUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={combinedUrl} alt={alt} className="w-full h-full object-cover" style={grayStyle} />
      )}
      {!loading && !combinedUrl && (
        <Image src={imageUrl} alt={alt} width={600} height={400} className="w-full h-full object-cover opacity-60" unoptimized style={grayStyle} />
      )}
    </div>
  )
}

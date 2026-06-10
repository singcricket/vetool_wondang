'use client'

import React, { useEffect, useState } from 'react'
import { fabric } from 'fabric'
import { cn } from '@/lib/utils/utils'

interface Props {
  imageUrl: string
  mark?: Record<string, unknown> | null
  className?: string
  aspectRatio?: string
  noHover?: boolean
}

export default function CheckupImageWithMark({
  imageUrl,
  mark,
  className,
  aspectRatio = 'aspect-square',
  noHover = false,
}: Props) {
  const [combinedImgUrl, setCombinedImgUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (!mark) {
      setIsLoading(false)
      return
    }

    try {
      const markStr = JSON.stringify(mark)
      const origW = (mark.origWidth as number) || 1000
      const origH = (mark.origHeight as number) || 600
      const bgInfo = mark.bgInfo as Record<string, unknown> | undefined

      const canvasElement = document.createElement('canvas')
      const fCanvas = new fabric.StaticCanvas(canvasElement, { width: origW, height: origH })

      fCanvas.loadFromJSON(markStr, () => {
        if (!isMounted) return

        fabric.Image.fromURL(
          imageUrl,
          (img) => {
            if (!isMounted) return

            if (bgInfo) {
              img.set({
                angle: (bgInfo.angle as number) || 0,
                flipX: !!bgInfo.flipX,
                flipY: !!bgInfo.flipY,
              })
            }

            const imgWidth = img.width || 1000
            const imgHeight = img.height || 1000
            const canvasAspect = origW / origH
            const isVertical = (img.angle || 0) === 90 || (img.angle || 0) === 270
            const actualW = isVertical ? imgHeight : imgWidth
            const actualH = isVertical ? imgWidth : imgHeight
            const scaleFactor = canvasAspect >= actualW / actualH ? origH / actualH : origW / actualW

            img.set({
              originX: 'center',
              originY: 'center',
              left: origW / 2,
              top: origH / 2,
              scaleX: scaleFactor,
              scaleY: scaleFactor,
            })

            fCanvas.setBackgroundImage(img, () => {
              fCanvas.renderAll()

              const imageWidthOnCanvas = imgWidth * scaleFactor
              const imageHeightOnCanvas = imgHeight * scaleFactor
              const startX = (origW - imageWidthOnCanvas) / 2
              const startY = (origH - imageHeightOnCanvas) / 2

              try {
                const dataURL = fCanvas.toDataURL({
                  format: 'png',
                  multiplier: 2,
                  left: startX,
                  top: startY,
                  width: imageWidthOnCanvas,
                  height: imageHeightOnCanvas,
                })
                if (isMounted) setCombinedImgUrl(dataURL)
              } catch (e) {
                console.error('Checkup mark capture failed', e)
              }

              if (isMounted) setIsLoading(false)
              fCanvas.dispose()
            })
          },
          { crossOrigin: 'anonymous' },
        )
      })
    } catch (e) {
      console.error('Failed to render checkup mark', e)
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [imageUrl, mark])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded bg-slate-50 flex items-center justify-center transition-all duration-300 transform-gpu',
        !noHover &&
          'hover:shadow-xl hover:shadow-slate-400/50 hover:scale-[1.03] hover:-translate-y-0.5 hover:z-10',
        aspectRatio,
        className,
      )}
    >
      {!mark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-contain block"
          crossOrigin="anonymous"
          onLoad={() => setIsLoading(false)}
        />
      )}
      {mark && combinedImgUrl && !isLoading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={combinedImgUrl} alt="" className="w-full h-full object-contain block" />
      )}
      {mark && !combinedImgUrl && !isLoading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-contain block opacity-50 grayscale"
          crossOrigin="anonymous"
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 bg-slate-50">
          마킹 로드 중...
        </div>
      )}
    </div>
  )
}

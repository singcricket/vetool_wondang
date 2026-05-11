'use client'

import React, { useEffect, useState } from 'react'
import { fabric } from 'fabric'
import { cn } from '@/lib/utils/utils'

interface Props {
  imageUrl: string
  mark?: string | null
  className?: string
  aspectRatio?: string
  noHover?: boolean
}

export default function OphthalmicImageWithMark({ 
  imageUrl, 
  mark, 
  className,
  aspectRatio = "aspect-square",
  noHover = false
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
      const parsedMark = JSON.parse(mark)
      const origW = parsedMark.origWidth || 1000
      const origH = parsedMark.origHeight || 600

      const canvasElement = document.createElement('canvas')
      const fCanvas = new fabric.StaticCanvas(canvasElement, { width: origW, height: origH })

      fCanvas.loadFromJSON(mark, () => {
        if (!isMounted) return

        fabric.Image.fromURL(imageUrl, (img) => {
          if (!isMounted) return
          
          const canvasAspect = origW / origH
          const imgWidth = img.width || 1000
          const imgHeight = img.height || 1000

          if (parsedMark.bgInfo) {
            img.set({
              angle: parsedMark.bgInfo.angle || 0,
              flipX: !!parsedMark.bgInfo.flipX,
              flipY: !!parsedMark.bgInfo.flipY
            })
          }

          const isVertical = (img.angle || 0) === 90 || (img.angle || 0) === 270
          const actualW = isVertical ? imgHeight : imgWidth
          const actualH = isVertical ? imgWidth : imgHeight
          const scaleFactor = canvasAspect >= (actualW / actualH) ? origH / actualH : origW / actualW

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
                height: imageHeightOnCanvas
              })
              setCombinedImgUrl(dataURL)
            } catch (e) {
              console.error("Captured Mark Image Failed", e)
            }
            
            setIsLoading(false)
            fCanvas.dispose()
          })
        }, { crossOrigin: 'anonymous' })
      })
    } catch (e) {
      console.error('Failed to parse or load markings', e)
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [imageUrl, mark])

  return (
    <div className={cn(
      "relative overflow-hidden rounded bg-slate-900 flex items-center justify-center transition-all duration-300 transform-gpu",
      !noHover && "hover:shadow-xl hover:shadow-slate-400/50 hover:scale-[1.03] hover:-translate-y-0.5 hover:z-10",
      aspectRatio,
      className
    )}>
      {!mark && (
        <img 
          src={imageUrl} 
          alt="ophthalmic" 
          className="w-full h-full object-contain block"
          crossOrigin="anonymous"
          onLoad={() => setIsLoading(false)}
        />
      )}

      {mark && combinedImgUrl && !isLoading && (
        <img 
          src={combinedImgUrl} 
          alt="marked-ophthalmic" 
          className="w-full h-full object-contain block"
        />
      )}

      {mark && !combinedImgUrl && !isLoading && (
        <img 
          src={imageUrl} 
          alt="ophthalmic-fallback" 
          className="w-full h-full object-contain block opacity-50 grayscale"
          crossOrigin="anonymous"
        />
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-500 bg-slate-900 uppercase tracking-widest">
          Loading Markings...
        </div>
      )}
    </div>
  )
}

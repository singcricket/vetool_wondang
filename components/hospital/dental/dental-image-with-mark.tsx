'use client'

import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { cn } from '@/lib/utils/utils'

interface Props {
  imageUrl: string
  mark?: string | null
  className?: string
  aspectRatio?: string // e.g. "aspect-square"
  noHover?: boolean
}

export default function DentalImageWithMark({ 
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
      // 에디터에서 저장된 실제 캔버스 크기를 사용해 완벽한 좌표계를 재현
      const origW = parsedMark.origWidth || 1000
      const origH = parsedMark.origHeight || 600

      const canvasElement = document.createElement('canvas')
      const fCanvas = new fabric.StaticCanvas(canvasElement, { width: origW, height: origH })

      // 1. 마킹 JSON 먼저 로드 (배경 이미지 초기화 방지)
      fCanvas.loadFromJSON(mark, () => {
        if (!isMounted) return

        // 2. 배경 이미지 로드 (CORS 처리)
        fabric.Image.fromURL(imageUrl, (img) => {
          if (!isMounted) return
          
          const canvasAspect = origW / origH
          const imgWidth = img.width || 1000
          const imgHeight = img.height || 1000
          const imgAspect = imgWidth / imgHeight

          // 에디터와 100% 동일한 스케일/중앙정렬 로직 적용
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
            
            // 3. 실제 이미지가 캔버스 상에 차지하는 영역 (Bounding Box) 계산
            const imageWidthOnCanvas = imgWidth * scaleFactor
            const imageHeightOnCanvas = imgHeight * scaleFactor
            const startX = (origW - imageWidthOnCanvas) / 2
            const startY = (origH - imageHeightOnCanvas) / 2

            try {
              // 4. 해당 위치만 정확하게 잘라내어 추출 (고해상도 multiplier 2)
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
              console.error("Captured Mark Image Failed (CORS issue)", e)
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
      "relative overflow-hidden rounded bg-slate-50 flex items-center justify-center transition-all duration-300 transform-gpu",
      !noHover && "hover:shadow-xl hover:shadow-slate-400/50 hover:scale-[1.03] hover:-translate-y-0.5 hover:z-10",
      aspectRatio,
      className
    )}>
      {/* 마킹이 없는 일반 상태 */}
      {!mark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={imageUrl} 
          alt="dental" 
          className="w-full h-full object-contain block"
          crossOrigin="anonymous"
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* 마킹이 합성된 고해상도 상태 */}
      {mark && combinedImgUrl && !isLoading && (
        <img 
          src={combinedImgUrl} 
          alt="marked-dental" 
          className="w-full h-full object-contain block"
        />
      )}

      {/* 원본 이미지를 불렀으나 마킹 합성에 실패했을때의 fallback */}
      {mark && !combinedImgUrl && !isLoading && (
        <img 
          src={imageUrl} 
          alt="dental-fallback" 
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

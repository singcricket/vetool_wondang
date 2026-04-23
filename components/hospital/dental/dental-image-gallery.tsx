'use client'

import React, { useState, useEffect } from 'react'
import type { DentalImage } from '@/types/dental/dental-type'
import { cn } from '@/lib/utils/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const DentalImageEditor = dynamic(() => import('./dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

const DentalImageWithMark = dynamic(() => import('./dental-image-with-mark'), { 
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

interface Props {
  images: DentalImage[]
  title?: string
  className?: string
  imageContainerClassName?: string
  imageHeight?: string // e.g., 'h-32' or 'h-[72px]'
}

export default function DentalImageGallery({ 
  images, 
  title, 
  className, 
  imageContainerClassName,
  imageHeight = 'h-32'
}: Props) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [localImages, setLocalImages] = useState<DentalImage[]>(images)

  // 상위 props가 변경되면 로컬 상태 동기화
  useEffect(() => {
    setLocalImages(images)
  }, [images])

  // Supabase Realtime 구독을 통해 이미지 마킹 실시간 업데이트
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('dental_images_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dental_images',
        },
        (payload) => {
          const updatedImage = payload.new as DentalImage
          setLocalImages((prev) => 
            prev.map((img) => 
              img.dental_image_id === updatedImage.dental_image_id 
                ? { ...img, mark: updatedImage.mark } 
                : img
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const selectedImage = localImages.find(img => img.dental_image_id === selectedImageId)

  if (images.length === 0) return null

  return (
    <>
      <div className={cn("mt-4 p-4 border-t border-dashed bg-slate-50/50", className)}>
        {title && (
          <h4 className="text-xs font-semibold text-slate-500 mb-2">
            {title} {localImages.length > 0 && `(${localImages.length}장)`}
          </h4>
        )}
        <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-thin", imageContainerClassName)}>
          {localImages.map((img) => (
            <div 
              key={img.dental_image_id} 
              onClick={() => setSelectedImageId(img.dental_image_id)}
              className={cn(
                "shrink-0 cursor-pointer",
                imageHeight
              )}
            >
              <DentalImageWithMark 
                imageUrl={img.img_url} 
                mark={img.mark} 
                aspectRatio="aspect-square" 
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedImageId} onOpenChange={(open) => !open && setSelectedImageId(null)} modal={false}>
        <DialogContent 
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[100]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>치과 이미지 에디터</DialogTitle>
            <DialogDescription>도형 및 글자를 추가하고 그림을 그릴 수 있는 에디터입니다.</DialogDescription>
          </VisuallyHidden>
          
          {selectedImage && (
             <DentalImageEditor 
               imageId={selectedImage.dental_image_id} 
               imageUrl={selectedImage.img_url} 
               initialMark={selectedImage.mark} 
               onClose={() => setSelectedImageId(null)}
             />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

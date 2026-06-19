'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { DentalImage } from '@/types/dental/dental-type'
import { cn } from '@/lib/utils/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { ReactSortable } from 'react-sortablejs'
import { GripVertical } from 'lucide-react'

const DentalImageEditor = dynamic(() => import('./dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

const DentalImageWithMark = dynamic(() => import('./dental-image-with-mark'), {
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

type SortableImage = DentalImage & { id: string }

interface Props {
  images: DentalImage[]
  title?: string
  className?: string
  imageContainerClassName?: string
  imageHeight?: string
  onOrderChange?: (orderedIds: string[]) => void
}

export default function DentalImageGallery({
  images,
  title,
  className,
  imageContainerClassName,
  imageHeight = 'h-32',
  onOrderChange,
}: Props) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [localImages, setLocalImages] = useState<DentalImage[]>(images)
  const [sortableImages, setSortableImages] = useState<SortableImage[]>(
    images.map(img => ({ ...img, id: img.dental_image_id }))
  )
  const sortedListRef = useRef<SortableImage[]>(sortableImages)

  useEffect(() => {
    setLocalImages(images)
    const mapped = images.map(img => ({ ...img, id: img.dental_image_id }))
    setSortableImages(mapped)
    sortedListRef.current = mapped
  }, [images])

  // Supabase Realtime — mark 업데이트
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('dental_images_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dental_images' },
        (payload) => {
          const updatedImage = payload.new as DentalImage
          setLocalImages((prev) =>
            prev.map((img) =>
              img.dental_image_id === updatedImage.dental_image_id
                ? { ...img, mark: updatedImage.mark }
                : img
            )
          )
          setSortableImages((prev) =>
            prev.map((img) =>
              img.dental_image_id === updatedImage.dental_image_id
                ? { ...img, mark: updatedImage.mark }
                : img
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleReorder = () => {
    onOrderChange?.(sortedListRef.current.map(img => img.dental_image_id))
  }

  const selectedImage = (onOrderChange ? sortableImages : localImages)
    .find(img => img.dental_image_id === selectedImageId)

  if (images.length === 0) return null

  return (
    <>
      <div className={cn("mt-4 p-4 border-t border-dashed bg-slate-50/50", className)}>
        {title && (
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-semibold text-slate-500">
              {title} {(onOrderChange ? sortableImages : localImages).length > 0 && `(${(onOrderChange ? sortableImages : localImages).length}장)`}
            </h4>
            {onOrderChange && (
              <span className="text-[10px] text-slate-400 italic">드래그로 순서 변경</span>
            )}
          </div>
        )}

        {onOrderChange ? (
          <ReactSortable
            list={sortableImages}
            setList={(newList) => {
              sortedListRef.current = newList
              setSortableImages(newList)
            }}
            className={cn("flex gap-4 overflow-x-auto pb-3 scrollbar-thin", imageContainerClassName)}
            animation={200}
            onEnd={handleReorder}
          >
            {sortableImages.map((img) => (
              <div
                key={img.dental_image_id}
                onClick={() => setSelectedImageId(img.dental_image_id)}
                className={cn(
                  "shrink-0 cursor-grab active:cursor-grabbing relative group rounded-md overflow-hidden border border-slate-200",
                  imageHeight
                )}
              >
                <DentalImageWithMark
                  imageUrl={img.img_url}
                  mark={img.mark}
                  aspectRatio="aspect-square"
                  className="h-full"
                />
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-80 transition-opacity pointer-events-none bg-black/40 rounded p-0.5">
                  <GripVertical size={13} className="text-white" />
                </div>
              </div>
            ))}
          </ReactSortable>
        ) : (
          <div className={cn("flex gap-4 overflow-x-auto pb-3 scrollbar-thin", imageContainerClassName)}>
            {localImages.map((img) => (
              <div
                key={img.dental_image_id}
                onClick={() => setSelectedImageId(img.dental_image_id)}
                className={cn("shrink-0 cursor-pointer rounded-md overflow-hidden border border-slate-200", imageHeight)}
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
        )}
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

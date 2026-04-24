'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import type { DentalImage } from '@/types/dental/dental-type'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

const DentalImageWithMark = dynamic(() => import('../dental-image-with-mark'), { 
  ssr: false,
  loading: () => <div className="aspect-square bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
})

const DentalImageEditor = dynamic(() => import('../dental-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white">에디터 로딩 중...</div>
})

export default function ImageCard({ img, isShared }: { img: DentalImage; isShared?: boolean }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <>
      <div 
        className="border rounded bg-slate-50 p-0.5 relative group overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
        onClick={() => setViewerOpen(true)}
      >
        <DentalImageWithMark 
          imageUrl={img.img_url} 
          mark={img.mark} 
          aspectRatio="aspect-square" 
        />
        {img.is_radio && (
          <div className="absolute top-1 left-1 pointer-events-none">
            <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 font-bold shadow-sm rounded">X-Ray</span>
          </div>
        )}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen} modal={false}>
        <DialogContent 
          className={cn(
            "p-0 m-0 border-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-none z-[200]",
            isShared 
              ? "max-w-[90vw] w-[1200px] h-auto aspect-auto border border-slate-700 shadow-2xl rounded-xl z-[150]" 
              : "outline-none max-w-[100vw] w-screen h-screen max-h-[100vh] z-[200]"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>{isShared ? '이미지 크게 보기' : '치과 이미지 에디터'}</DialogTitle>
            <DialogDescription>{isShared ? '상세 이미지를 확인합니다.' : '이미지 마킹을 확인하거나 수정할 수 있습니다.'}</DialogDescription>
          </VisuallyHidden>
          
          {viewerOpen && (
             isShared ? (
                <div className="relative w-full h-full p-4 flex items-center justify-center">
                  <DentalImageWithMark 
                    imageUrl={img.img_url} 
                    mark={img.mark} 
                    aspectRatio="aspect-auto" 
                    className="max-h-[80vh] w-full"
                    noHover={true}
                  />
                  <Button 
                    variant="ghost" 
                    className="absolute top-4 right-4 text-white hover:bg-white/10" 
                    onClick={() => setViewerOpen(false)}
                  >
                    닫기
                  </Button>
                </div>
             ) : (
                <DentalImageEditor 
                  imageId={img.dental_image_id} 
                  imageUrl={img.img_url} 
                  initialMark={img.mark} 
                  onClose={() => setViewerOpen(false)}
                />
             )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

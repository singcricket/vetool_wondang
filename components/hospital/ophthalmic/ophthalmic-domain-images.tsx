'use client'

import React, { useState, useEffect } from 'react'
import { getOphthalmicImages } from '@/lib/actions/ophthalmic/get-ophthalmic-images'
import { Loader2, Eye, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import OphthalmicImageWithMark from './ophthalmic-image-with-mark'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog'

const OphthalmicImageEditor = dynamic(() => import('./ophthalmic-image-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-slate-900 text-white font-black uppercase tracking-widest animate-pulse">Editor Loading...</div>
})

interface OphthalmicImage {
  id: string
  img_url: string
  tags: string[] | null
  side: string | null
  mark: string | null
  created_at: string
}

interface Props {
  chartId: string
  tag: string
}

export default function OphthalmicDomainImages({ chartId, tag }: Props) {
  const [images, setImages] = useState<OphthalmicImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingImage, setEditingImage] = useState<OphthalmicImage | null>(null)

  const fetchImages = async () => {
    setIsLoading(true)
    const data = await getOphthalmicImages(chartId)
    // Filter by tag safely
    const filtered = (data || []).filter((img: any) => img.tags?.includes(tag))
    setImages(filtered as unknown as OphthalmicImage[])
    setIsLoading(false)
  }

  useEffect(() => {
    if (chartId) fetchImages()
  }, [chartId, tag])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        <span className="text-xs font-bold text-slate-400">사진 불러오는 중...</span>
      </div>
    )
  }

  if (images.length === 0) return null

  return (
    <>
      <div className="space-y-3 mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <Eye className="w-4 h-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">관련 검사 사진 ({tag})</h3>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {images.map((img) => (
            <div 
              key={img.id} 
              className="group relative w-44 h-44 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setEditingImage(img)}
            >
              <OphthalmicImageWithMark 
                imageUrl={img.img_url} 
                mark={img.mark} 
                aspectRatio="aspect-square" 
              />
              
              {/* Side Label */}
              <div className="absolute top-2 left-2 z-10">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight shadow-sm border",
                  img.side === 'OD' ? "bg-blue-600 border-blue-400 text-white" :
                  img.side === 'OS' ? "bg-orange-600 border-orange-400 text-white" :
                  "bg-slate-800 border-slate-600 text-white"
                )}>
                  {img.side || 'OU'}
                </span>
              </div>

              {/* Hover Indicator */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)} modal={false}>
        <DialogContent 
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[150]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>안과 이미지 에디터</DialogTitle>
            <DialogDescription>사진 위에 소견을 직접 마킹합니다.</DialogDescription>
          </VisuallyHidden>
          
          {editingImage && (
             <OphthalmicImageEditor 
               imageId={editingImage.id} 
               imageUrl={editingImage.img_url} 
               initialMark={editingImage.mark} 
               onClose={() => {
                 setEditingImage(null)
                 fetchImages()
               }}
             />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ZoomIn, Pen, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

const CheckupImageWithMark = dynamic(
  () =>
    import(
      '@/components/hospital/checkup/checkup-case/checkup-image-uploader/checkup-image-with-mark'
    ),
  { ssr: false },
)

const CheckupImageEditor = dynamic(
  () =>
    import(
      '@/components/hospital/checkup/checkup-case/checkup-image-uploader/checkup-image-editor'
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-900 text-white text-sm">
        에디터 로딩 중...
      </div>
    ),
  },
)

export interface CheckupImgData {
  id: string
  img_url: string
  img_memo?: string | null
  mark?: Record<string, unknown> | null
  tags?: string[]
  is_cover?: boolean
}

interface Props {
  img: CheckupImgData
  checkupId: string
  isShared?: boolean
  className?: string
}

export default function CheckupImgCard({ img, checkupId, isShared, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="group w-full cursor-pointer" onClick={() => setOpen(true)}>

        {/* ── 썸네일 카드 ── */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl',
            'border border-slate-200 shadow-sm',
            'transition-all duration-300',
            'group-hover:shadow-lg group-hover:border-teal-300',
            'aspect-square w-full',
            className,
          )}
        >
          {/* 이미지 */}
          {img.mark ? (
            <CheckupImageWithMark
              imageUrl={img.img_url}
              mark={img.mark}
              aspectRatio=""
              className="w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.img_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* 호버 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 shadow-md transition-all duration-300 group-hover:translate-y-0">
              <ZoomIn size={15} className="text-slate-700" strokeWidth={2} />
            </div>
          </div>

          {/* 마킹 배지 */}
          {img.mark && (
            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-teal-500/90 px-2 py-0.5 shadow backdrop-blur-sm print:hidden">
              <Pen size={9} className="text-white" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-white">마킹</span>
            </div>
          )}

          {/* 대표 사진 배지 */}
          {img.is_cover && (
            <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 shadow backdrop-blur-sm print:hidden">
              <Star size={9} className="text-white" strokeWidth={2.5} fill="currentColor" />
              <span className="text-[9px] font-bold text-white">대표</span>
            </div>
          )}
        </div>

        {/* 메모 */}
        {img.img_memo && (
          <p className="mt-1.5 px-0.5 text-[11px] leading-snug text-slate-500">{img.img_memo}</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent
          className={cn(
            'p-0 m-0 border-0 flex flex-col bg-slate-900/95 rounded-none',
            isShared
              ? 'max-w-[90vw] w-[1200px] h-auto aspect-auto border border-slate-700 shadow-2xl rounded-xl z-[150]'
              : 'max-w-[100vw] w-screen h-screen max-h-[100vh] z-[200]',
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>{isShared ? '이미지 크게 보기' : '검진 이미지 에디터'}</DialogTitle>
            <DialogDescription>
              {isShared ? '상세 이미지를 확인합니다.' : '이미지 마킹을 확인하거나 수정할 수 있습니다.'}
            </DialogDescription>
          </VisuallyHidden>

          {open && (
            isShared ? (
              <div className="relative w-full h-full p-4 flex items-center justify-center">
                <CheckupImageWithMark
                  imageUrl={img.img_url}
                  mark={img.mark}
                  aspectRatio=""
                  className="max-h-[80vh] w-full"
                  noHover
                />
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 text-white hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  닫기
                </Button>
              </div>
            ) : (
              <CheckupImageEditor
                imageId={img.id}
                imageUrl={img.img_url}
                checkupId={checkupId}
                initialMark={img.mark}
                initialTags={img.tags ?? []}
                initialIsCover={img.is_cover ?? false}
                initialMemo={img.img_memo}
                onClose={() => setOpen(false)}
                onSaved={() => setOpen(false)}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

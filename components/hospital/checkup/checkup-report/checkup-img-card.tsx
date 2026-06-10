'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
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
      <div
        className={cn(
          'flex flex-col gap-1 cursor-pointer group',
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <div className="relative overflow-hidden rounded hover:ring-2 hover:ring-teal-400 transition-all">
          {img.mark ? (
            <CheckupImageWithMark
              imageUrl={img.img_url}
              mark={img.mark}
              aspectRatio="aspect-square"
              className="w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.img_url}
              alt=""
              className="aspect-square w-full object-cover block"
            />
          )}
        </div>
        {img.img_memo && (
          <p className="px-0.5 text-[11px] leading-snug text-slate-500">{img.img_memo}</p>
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

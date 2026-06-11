'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/utils'
import type { CheckupImage } from '@/lib/actions/checkup/checkup-image-actions'

const CheckupImageEditor = dynamic(
  () => import('./checkup-image-uploader/checkup-image-editor'),
  { ssr: false },
)

interface Props {
  checkupId: string
  images: CheckupImage[]
  onEdited?: () => void
  maxVisible?: number
  className?: string
}

export default function CheckupImageStrip({
  checkupId,
  images,
  onEdited,
  maxVisible = 5,
  className,
}: Props) {
  const [editorImage, setEditorImage] = useState<CheckupImage | null>(null)

  if (images.length === 0) return null

  const visible = images.slice(0, maxVisible)
  const extraCount = images.length - maxVisible

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
        {visible.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setEditorImage(img)}
            className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition-all hover:border-teal-400 hover:ring-1 hover:ring-teal-200"
            title={img.img_memo ?? '클릭하여 편집'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.img_url} alt="" className="h-full w-full object-cover" />
            {img.mark && (
              <Pencil className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 text-teal-300 drop-shadow" />
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
          </button>
        ))}
        {extraCount > 0 && (
          <button
            type="button"
            onClick={() => setEditorImage(images[maxVisible])}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 transition-colors hover:border-teal-400 hover:text-teal-600"
          >
            +{extraCount}
          </button>
        )}
      </div>

      <Dialog
        open={!!editorImage}
        onOpenChange={(open) => { if (!open) setEditorImage(null) }}
        modal={false}
      >
        <DialogContent
          className="max-w-none w-screen h-screen p-0 m-0 rounded-none border-none overflow-hidden [&>button]:hidden z-[150]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>검진 이미지 에디터</DialogTitle>
          </VisuallyHidden>
          {editorImage && (
            <CheckupImageEditor
              imageId={editorImage.id}
              imageUrl={editorImage.img_url}
              checkupId={checkupId}
              initialMark={editorImage.mark}
              initialTags={editorImage.tags}
              initialIsCover={editorImage.is_cover}
              initialMemo={editorImage.img_memo}
              onClose={() => setEditorImage(null)}
              onSaved={() => {
                setEditorImage(null)
                onEdited?.()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

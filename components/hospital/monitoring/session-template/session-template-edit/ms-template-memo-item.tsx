'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { CheckIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { GripVertical, XIcon } from 'lucide-react'
import { useState } from 'react'
import MsMemoImageGallery from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-gallery'
import { deleteMsMemoImage } from '@/lib/services/monitoring/delete-ms-memo-image'
import { useMsMemoImageUpload } from '@/hooks/use-ms-memo-image-upload'
import MsMemoImageUploadButtons from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-upload-buttons'

type Props = {
  memo: MsMemo
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string, newImgUrls: string[]) => void
  templateId: string
}

export default function MsTemplateMemoItem({
  memo,
  onDelete,
  onEdit,
  templateId,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(memo.memo)
  const [editedImgUrls, setEditedImgUrls] = useState<string[]>(memo.img_url || [])
  const [deletedImgUrls, setDeletedImgUrls] = useState<string[]>([])

  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const { isUploading, cameraInputRef, galleryInputRef, handleFileUpload } =
    useMsMemoImageUpload({
      sessionId: templateId,
      onUploadComplete: async (urls: string[]) => {
        setEditedImgUrls((prev) => [...prev, ...urls])
      },
    })

  const handleSave = async () => {
    if (editText.trim() === '' && editedImgUrls.length === 0) return

    if (deletedImgUrls.length > 0) {
      await deleteMsMemoImage(deletedImgUrls)
      setDeletedImgUrls([])
    }

    onEdit(memo.id, editText.trim(), editedImgUrls)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(memo.memo)
    setEditedImgUrls(memo.img_url || [])
    setDeletedImgUrls([])
    setIsEditing(false)
  }

  return (
    <div
      className="group relative flex w-full items-start rounded-md px-2 py-1 transition-colors hover:bg-black/5"
      style={{
        backgroundColor: memo.color || '#F3F4F6',
      }}
    >
      {!isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className="drag-handle z-20 h-8 w-6 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </Button>
      )}

      <div className="flex flex-1 flex-col gap-1 p-1">
        {isEditing ? (
          <div className="relative flex flex-col gap-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSave()
                }
                if (e.key === 'Escape') handleCancel()
              }}
              className="min-h-[60px] w-full resize-none bg-white/50 text-sm pr-20"
              autoFocus
              disabled={isUploading}
            />
            
            <div className="absolute right-1 top-1 flex items-center gap-1">
              <MsMemoImageUploadButtons
                isUploading={isUploading}
                cameraInputRef={cameraInputRef}
                galleryInputRef={galleryInputRef}
                handleFileUpload={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary hover:bg-primary/10"
                onClick={handleSave}
                type="button"
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
            </div>

            {editedImgUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editedImgUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-12 w-12 overflow-hidden rounded-md border border-black/10"
                  >
                    <img
                      src={url}
                      alt="thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = [...editedImgUrls]
                        newUrls.splice(idx, 1)
                        setEditedImgUrls(newUrls)
                        setDeletedImgUrls((prev) => [...prev, url])
                      }}
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <XIcon size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex flex-1 flex-col gap-1">
              <span
                className="cursor-pointer whitespace-pre-wrap break-words text-sm leading-snug"
                onClick={() => setIsEditing(true)}
              >
                {memo.memo}
              </span>

              {memo.has_imgs && memo.img_url && memo.img_url.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {memo.img_url.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedImageIndex(idx)
                        setIsGalleryOpen(true)
                      }}
                      className="relative h-14 w-14 cursor-pointer overflow-hidden rounded-md border border-black/10 transition-opacity hover:opacity-80 shadow-sm"
                    >
                      <img
                        src={url}
                        alt="thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                onClick={() => setIsEditing(true)}
                type="button"
              >
                <Pencil1Icon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(memo.id)}
                type="button"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <MsMemoImageGallery
        imgUrls={memo.img_url || []}
        isGalleryOpen={isGalleryOpen}
        setIsGalleryOpen={setIsGalleryOpen}
        selectedImageIndex={selectedImageIndex}
      />
    </div>
  )
}

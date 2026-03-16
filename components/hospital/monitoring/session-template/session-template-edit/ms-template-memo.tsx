'use client'

import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { MEMO_COLORS } from '@/constants/hospital/icu/chart/colors'
import type { MemoColor } from '@/types/icu/chart'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { CheckIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { XIcon } from 'lucide-react'
import { type Dispatch, type SetStateAction, useState, useRef } from 'react'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'
import { useMsMemoImageUpload } from '@/hooks/use-ms-memo-image-upload'
import { toast } from 'sonner'
import MsMemoImageGallery from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-gallery'
import { deleteMsMemoImage } from '@/lib/services/monitoring/delete-ms-memo-image'

type Props = {
  memos: MsMemo[]
  setMemos: Dispatch<SetStateAction<MsMemo[]>>
  templateId: string
}

// ── 개별 메모 아이템 (인라인 편집 포함) ──
function MemoItem({
  memo,
  onDelete,
  onEdit,
}: {
  memo: MsMemo
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string, newImgUrls: string[]) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(memo.memo)
  const [editedImgUrls, setEditedImgUrls] = useState<string[]>(memo.img_url || [])
  const [deletedImgUrls, setDeletedImgUrls] = useState<string[]>([])
  
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

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
      className="flex flex-col gap-2 rounded-md border p-2 text-sm"
      style={{ borderLeftColor: memo.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start gap-2">
        {isEditing ? (
          <>
            <div className="flex-1 flex flex-col gap-2">
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
                className="w-full min-h-[60px] resize-none text-sm"
                autoFocus
              />
              
              {editedImgUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editedImgUrls.map((url, idx) => (
                    <div key={idx} className="relative h-12 w-12 overflow-hidden rounded-md border border-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="thumbnail" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const newUrls = [...editedImgUrls]
                          newUrls.splice(idx, 1)
                          setEditedImgUrls(newUrls)
                          setDeletedImgUrls(prev => [...prev, url])
                        }}
                        className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <XIcon size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-primary"
              onClick={handleSave}
              type="button"
            >
              <CheckIcon />
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col gap-1">
              <span
                className="cursor-pointer whitespace-pre-wrap break-words"
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
                      className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-md border border-black/10 transition-opacity hover:opacity-80"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              <Pencil1Icon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(memo.id)}
              type="button"
            >
              <TrashIcon />
            </Button>
          </>
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

// ── 메인 컴포넌트 ──
export default function MsTemplateMemo({ memos, setMemos, templateId }: Props) {
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[0])

  const { isUploading, cameraInputRef, galleryInputRef, handleFileUpload } =
    useMsMemoImageUpload({
      sessionId: templateId,
      onUploadComplete: async (urls) => {
        handleAddMemo(urls)
      },
    })

  const handleAddMemo = (imgUrls: string[] = []) => {
    if (memoInput.trim() === '' && imgUrls.length === 0) return
    const createdAt = new Date().toISOString()
    const newMemo: MsMemo = {
      id: `${createdAt}-${Math.random().toString(36).substring(2, 11)}`,
      memo: memoInput.trim(),
      check: '',
      create_timestamp: createdAt,
      color: memoColor,
      is_done: false,
      is_realtime_memo: false,
      done_timestamp: null,
      chosen: false,
      has_imgs: imgUrls.length > 0,
      img_url: imgUrls,
    }
    setMemos((prev) => [...prev, newMemo])
    setMemoInput('')

    if (imgUrls.length > 0) {
      toast.success('이미지가 포함된 메모가 추가되었습니다')
    }
  }

  const handleDeleteMemo = async (id: string) => {
    const memoToDelete = memos.find((m) => m.id === id)
    if (memoToDelete && memoToDelete.has_imgs && memoToDelete.img_url) {
      await deleteMsMemoImage(memoToDelete.img_url)
    }
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }

  const handleEditMemo = (id: string, newText: string, newImgUrls: string[]) =>
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, memo: newText, img_url: newImgUrls, has_imgs: newImgUrls.length > 0 } : m)),
    )

  const txMemos = memos.filter((m) => !m.is_realtime_memo)

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        처치 및 추가정보 ({txMemos.length})
      </h3>

      <ScrollArea className="h-44 rounded-t-md border p-2">
        <div className="space-y-2">
          {txMemos.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              메모 없음
            </p>
          ) : (
            txMemos.map((m) => (
              <MemoItem
                key={m.id}
                memo={m}
                onDelete={handleDeleteMemo}
                onEdit={handleEditMemo}
              />
            ))
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <div className="relative">
        <Textarea
          placeholder="줄 추가 : Shift + Enter ⏎"
          value={memoInput}
          onChange={(e) => setMemoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleAddMemo()
            }
          }}
          disabled={isUploading}
          className="w-full rounded-none rounded-b-md border-t-0 pr-24 text-sm placeholder:text-xs"
        />
        
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
          {/* 숨김 처리된 파일 인풋들 */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={handleFileUpload}
          />
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={galleryInputRef}
            onChange={handleFileUpload}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            title="사진 촬영"
            disabled={isUploading}
            onClick={() => cameraInputRef.current?.click()}
            type="button"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            title="사진 업로드"
            disabled={isUploading}
            onClick={() => galleryInputRef.current?.click()}
            type="button"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </Button>
          
          <MemoColorPicker memoColor={memoColor} setMemoColor={setMemoColor} className="static inset-auto" />
        </div>
      </div>
    </section>
  )
}

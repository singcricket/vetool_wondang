'use client'

import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { MEMO_COLORS } from '@/constants/hospital/icu/chart/colors'
import type { MemoColor } from '@/types/icu/chart'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { useMsMemoImageUpload } from '@/hooks/use-ms-memo-image-upload'
import { toast } from 'sonner'
import { deleteMsMemoImage } from '@/lib/services/monitoring/delete-ms-memo-image'
import MsMemoImageUploadButtons from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-upload-buttons'
import MsTemplateMemoItem from './ms-template-memo-item'
import { ReactSortable } from 'react-sortablejs'

type Props = {
  memos: MsMemo[]
  setMemos: Dispatch<SetStateAction<MsMemo[]>>
  templateId: string
}

// ── 메인 컴포넌트 ──
export default function MsTemplateMemo({ memos, setMemos, templateId }: Props) {
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[0])

  const { isUploading, cameraInputRef, galleryInputRef, handleFileUpload } =
    useMsMemoImageUpload({
      sessionId: templateId,
      onUploadComplete: async (urls: string[]) => {
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


  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        처치 및 추가정보 ({memos.length})
      </h3>

      <ScrollArea className="h-44 rounded-t-md border p-2">
        <ReactSortable
          list={memos}
          setList={setMemos}
          animation={200}
          handle=".drag-handle"
          className="space-y-2"
        >
          {memos.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              메모 없음
            </p>
          ) : (
            memos.map((m) => (
              <MsTemplateMemoItem
                key={m.id}
                memo={m}
                onDelete={handleDeleteMemo}
                onEdit={handleEditMemo}
                templateId={templateId}
              />
            ))
          )}
        </ReactSortable>
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
          <MsMemoImageUploadButtons
            isUploading={isUploading}
            cameraInputRef={cameraInputRef}
            galleryInputRef={galleryInputRef}
            handleFileUpload={handleFileUpload}
          />
          
          <MemoColorPicker memoColor={memoColor} setMemoColor={setMemoColor} className="static inset-auto" />
        </div>
      </div>
    </section>
  )
}

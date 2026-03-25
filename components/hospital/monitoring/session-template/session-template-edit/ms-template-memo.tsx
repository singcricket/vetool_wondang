'use client'

import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { ClipboardListIcon, PlusIcon, ChevronUpIcon } from 'lucide-react'
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
import MsMemoSchedulePicker from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-schedule-picker'
import { MsMemoSchedule } from '@/types/monitoring/monitoring-type'

type Props = {
  memos: MsMemo[]
  setMemos: Dispatch<SetStateAction<MsMemo[]>>
  templateId: string
}

export default function MsTemplateMemo({ memos, setMemos, templateId }: Props) {
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[0])
  const [memoSchedule, setMemoSchedule] = useState<MsMemoSchedule | undefined>(undefined)
  const [isInputOpen, setIsInputOpen] = useState(false)

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
      schedule: memoSchedule,
    }
    setMemos((prev) => [...prev, newMemo])
    setMemoInput('')
    setMemoSchedule(undefined)

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

  const handleEditMemo = (id: string, newText: string, newImgUrls: string[], newSchedule?: MsMemoSchedule) =>
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, memo: newText, img_url: newImgUrls, has_imgs: newImgUrls.length > 0, schedule: newSchedule } : m)),
    )


  return (
    <div className="flex w-full flex-col rounded-xl border-2 border-blue-200 bg-white overflow-hidden shadow-sm mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b-2 border-blue-200">
        <div className="flex items-center gap-2">
          <ClipboardListIcon size={16} className="text-blue-600 shrink-0" />
          <span className="text-sm font-black text-blue-700">처치 계획 템플릿 항목 ({memos.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsInputOpen((v) => !v)}
            title={isInputOpen ? '입력창 닫기' : '항목 추가'}
            className="ml-1 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {isInputOpen ? <ChevronUpIcon size={13} /> : <PlusIcon size={13} />}
            {isInputOpen ? '닫기' : '항목 추가'}
          </button>
        </div>
      </div>

      <ScrollArea className="h-56 bg-blue-50/20 p-2">
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
                memos={memos}
                onDelete={handleDeleteMemo}
                onEdit={handleEditMemo}
                templateId={templateId}
              />
            ))
          )}
        </ReactSortable>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Input */}
      {isInputOpen && (
        <div className="relative border-t-2 border-blue-200">
          <Textarea
            placeholder="처치 항목 추가 → Enter ⏎  |  줄바꿈 → Shift + Enter"
            value={memoInput}
            onChange={(e) => setMemoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleAddMemo()
              }
            }}
            disabled={isUploading}
            className="w-full rounded-none border-0 bg-white pl-3 pr-32 text-sm placeholder:text-xs placeholder:text-blue-300 focus-visible:ring-blue-200 resize-none"
          />
          
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
            <MsMemoSchedulePicker
              schedule={memoSchedule}
              onScheduleChange={setMemoSchedule}
              memos={memos}
              msData={undefined as any}
            />
            <MsMemoImageUploadButtons
              isUploading={isUploading}
              cameraInputRef={cameraInputRef}
              galleryInputRef={galleryInputRef}
              handleFileUpload={handleFileUpload}
            />
            
            <MemoColorPicker memoColor={memoColor} setMemoColor={setMemoColor} className="static inset-auto" />
          </div>
        </div>
      )}
    </div>
  )
}

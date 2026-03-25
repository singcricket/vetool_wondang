import DeleteMemoDialog from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/single-memo/delete-memo-dialog'
import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { MEMO_COLORS } from '@/constants/hospital/icu/chart/colors'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { cn } from '@/lib/utils/utils'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { CheckIcon, GripVerticalIcon, PencilIcon, XIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import MsMemoTimeStamp from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-timestamp'
import MsMemoImageGallery from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-gallery'
import { deleteMsMemoImage } from '@/lib/services/monitoring/delete-ms-memo-image'
import { useMsMemoImageUpload } from '@/hooks/use-ms-memo-image-upload'
import MsMemoImageUploadButtons from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-upload-buttons'
import MsMemoSchedulePicker from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-schedule-picker'
import { MsMemoSchedule } from '@/types/monitoring/monitoring-type'

type Props = {
  memo: MsMemo
  onDelete: () => void
  handleEditMemo: (editedMemo: MsMemo, memoId: string) => Promise<void>
  memoIndex: string
  isMemoNameSetting?: boolean
  msData: MsWithPatientWithWeight
}

const SingleMsTxMemo = React.forwardRef<HTMLLIElement, Props>(
  ({ memo, onDelete, handleEditMemo, memoIndex, isMemoNameSetting, msData }, ref) => {
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedMemo, setEditedMemo] = useState(memo.memo)
    const [editedMemoColor, setEditedMemoColor] = useState(memo.color)
    const [editedCreateTimestamp, setEditedCreateTimestamp] = useState(
      memo.create_timestamp,
    )
    const [editedDoneTimestamp, setEditedDoneTimestamp] = useState<string | null>(
      memo.done_timestamp,
    )
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [editedImgUrls, setEditedImgUrls] = useState<string[]>(memo.img_url || [])
    const [deletedImgUrls, setDeletedImgUrls] = useState<string[]>([])
    const [editedSchedule, setEditedSchedule] = useState<MsMemoSchedule | undefined>(
      memo.schedule,
    )

    const { isUploading, cameraInputRef, galleryInputRef, handleFileUpload } =
      useMsMemoImageUpload({
        sessionId: msData.session_id,
        onUploadComplete: async (urls: string[]) => {
          setEditedImgUrls((prev) => [...prev, ...urls])
        },
      })

    const editingTextAreaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (isEditMode && editingTextAreaRef.current) {
        const textarea = editingTextAreaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight + 20}px`
      }
    }, [isEditMode, editedMemo])

    useEffect(() => {
      setEditedMemo(memo.memo)
      setEditedMemoColor(memo.color)
      setEditedCreateTimestamp(memo.create_timestamp)
      setEditedDoneTimestamp(memo.done_timestamp)
      setEditedImgUrls(memo.img_url || [])
      setEditedSchedule(memo.schedule)
      setDeletedImgUrls([])
    }, [memo])

    const handleUpdateSingleMemo = async () => {
      if (editedMemo.trim().length === 0 && editedImgUrls.length === 0) {
        toast.warning('메모/이미지를 입력해주세요')
        editingTextAreaRef.current?.focus()
        return
      }

      if (deletedImgUrls.length > 0) {
        await deleteMsMemoImage(deletedImgUrls)
        setDeletedImgUrls([])
      }

      handleEditMemo(
        {
          ...memo,
          memo: editedMemo.trim(),
          color: editedMemoColor,
          create_timestamp: editedCreateTimestamp,
          done_timestamp: editedDoneTimestamp,
          is_done: !!editedDoneTimestamp,
          img_url: editedImgUrls,
          has_imgs: editedImgUrls.length > 0,
          schedule: editedSchedule,
        },
        memoIndex,
      )
      setIsEditMode(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleUpdateSingleMemo()
      }
    }

    const handleToggleDone = async () => {
      const isDone = !!editedDoneTimestamp
      const newTimestamp = isDone ? null : new Date().toISOString()

      setEditedDoneTimestamp(newTimestamp)

      await handleEditMemo(
        {
          ...memo,
          done_timestamp: newTimestamp,
          is_done: !isDone,
        },
        memoIndex,
      )
    }

    const isDone = !!editedDoneTimestamp

    // 예약 시간 텍스트 포맷팅 헬퍼
    const formatScheduleText = () => {
      if (!memo.schedule) return null

      if (memo.schedule.type === 'absolute') {
        return `⏰ 예정: ${memo.schedule.value}`
      }
      if (memo.schedule.type === 'after_start') {
        if (msData.start_time) {
          const time = new Date(new Date(msData.start_time).getTime() + Number(memo.schedule.value) * 60000)
          const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
          return `⏰ 예정: ${timeStr} (시작 후 ${memo.schedule.value}분)`
        }
        return `⏰ 시작 후 ${memo.schedule.value}분 뒤`
      }
      if (memo.schedule.type === 'after_prev') {
        const allMemos = msData.memo_tx as any as MsMemo[] | null
        const targetMemo = allMemos?.find((m) => m.id === memo.schedule?.target_memo_id)
        const targetName = targetMemo 
          ? (targetMemo.memo.length > 8 ? targetMemo.memo.slice(0, 8) + '...' : targetMemo.memo) 
          : '이전 처치'
        
        if (targetMemo?.done_timestamp) {
          const time = new Date(new Date(targetMemo.done_timestamp).getTime() + Number(memo.schedule.value) * 60000)
          const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
          return `⏰ 예정: ${timeStr} (${targetName} 완료 후 ${memo.schedule.value}분)`
        }
        return `⏰ ${targetName} 완료 후 ${memo.schedule.value}분 뒤`
      }
      return null
    }

    const scheduleText = formatScheduleText()

    return (
      <li
        className={cn(
          'group relative mb-1.5 flex w-full items-start gap-2 rounded-md border px-2 py-2 transition-all duration-200',
          isDone
            ? 'border-transparent bg-transparent opacity-60'
            : 'border-blue-200 bg-blue-50/60 shadow-sm',
        )}
        ref={ref}
        style={
          !isDone
            ? { borderLeftColor: editedMemoColor ?? MEMO_COLORS[0], borderLeftWidth: '3px' }
            : {}
        }
      >
        {/* Drag handle — only shown while not done */}
        {!isDone && (
          <GripVerticalIcon
            className="handle z-20 mt-0.5 hidden shrink-0 cursor-grab text-blue-300 2xl:block"
            size={15}
          />
        )}

        {/* Done checkbox */}
        <Checkbox
          checked={isDone}
          onCheckedChange={handleToggleDone}
          className={cn(
            'z-20 mt-0.5 h-4 w-4 shrink-0 rounded-sm border-2',
            isDone
              ? 'border-muted-foreground/40 bg-muted-foreground/20'
              : 'border-blue-400 bg-white',
          )}
        />

        <div className="flex w-full min-w-0 flex-col gap-1">
          {/* Header row: timestamp + action buttons */}
          <div className="flex items-center justify-between">
            {editedDoneTimestamp || isEditMode ? (
              <MsMemoTimeStamp
                editedCreateTimestamp={editedDoneTimestamp ?? new Date().toISOString()}
                isEditMode={isEditMode}
                setEditedCreateTimestamp={(value) => {
                  const date = new Date(value as string)
                  if (!isNaN(date.getTime())) {
                    setEditedDoneTimestamp(date.toISOString())
                  }
                }}
                editTimestamp={memo.done_timestamp}
                msData={msData}
              />
            ) : (
              <div className="text-xs font-medium text-blue-400">대기중</div>
            )}

            {!isEditMode && (
              <div
                className={cn(
                  'flex cursor-pointer items-center gap-2 text-muted-foreground opacity-0 transition duration-300 group-hover:opacity-100',
                  isMemoNameSetting && 'hidden',
                )}
              >
                <PencilIcon
                  size={13}
                  onClick={() => setIsEditMode(true)}
                  className="hover:text-blue-500"
                />
                <DeleteMemoDialog onDelete={onDelete} />
              </div>
            )}
          </div>

          {/* Content area */}
          {isEditMode ? (
            <div className="relative">
              <Textarea
                value={editedMemo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditedMemo(e.target.value)
                }
                className="min-h-8 overflow-hidden border-blue-200 bg-white px-1 py-0.5 pr-24 text-sm focus-visible:ring-blue-300"
                ref={editingTextAreaRef}
                onKeyDown={handleKeyDown}
              />

              {editedImgUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editedImgUrls.map((url, idx) => (
                    <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-md border border-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="memo attachment thumbnail" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const newUrls = [...editedImgUrls]
                          newUrls.splice(idx, 1)
                          setEditedImgUrls(newUrls)
                          setDeletedImgUrls((prev) => [...prev, url])
                        }}
                        className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                <MsMemoSchedulePicker
                  schedule={editedSchedule}
                  onScheduleChange={setEditedSchedule}
                  memos={msData.memo_tx as any as MsMemo[]}
                  currentMemoId={memo.id}
                  msData={msData}
                />
                <MsMemoImageUploadButtons
                  isUploading={isUploading}
                  cameraInputRef={cameraInputRef}
                  galleryInputRef={galleryInputRef}
                  handleFileUpload={handleFileUpload}
                />
                <MemoColorPicker
                  memoColor={editedMemoColor}
                  setMemoColor={setEditedMemoColor}
                  className="static inset-auto"
                />
              </div>
              <CheckIcon
                size={14}
                onClick={handleUpdateSingleMemo}
                className="absolute -top-5 right-0 cursor-pointer text-blue-500 hover:opacity-70"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                {scheduleText && (
                  <div className={cn("text-[11px] font-semibold", isDone ? "text-muted-foreground line-through opacity-60" : "text-blue-500")}>
                    {scheduleText}
                  </div>
                )}
                {memo.memo && (
                  <p
                    className={cn(
                      'mr-2 whitespace-pre-wrap break-all text-sm',
                      isDone && 'text-muted-foreground line-through decoration-muted-foreground/60',
                    )}
                  >
                    {memo.memo}
                  </p>
                )}
              </div>

              {/* 첨부된 이미지 썸네일 렌더링 */}
              {memo.has_imgs && memo.img_url && memo.img_url.length > 0 && (
                <>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {memo.img_url.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedImageIndex(idx)
                          setIsGalleryOpen(true)
                        }}
                        className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-md border border-black/10 transition-opacity hover:opacity-80"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="memo attachment thumbnail"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <MsMemoImageGallery
                    imgUrls={memo.img_url}
                    isGalleryOpen={isGalleryOpen}
                    setIsGalleryOpen={setIsGalleryOpen}
                    selectedImageIndex={selectedImageIndex}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </li>
    )
  },
)

SingleMsTxMemo.displayName = 'SingleMsTxMemo'

export default SingleMsTxMemo

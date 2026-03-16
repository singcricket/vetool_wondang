import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import DeleteMemoDialog from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/single-memo/delete-memo-dialog'
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

type Props = {
  memo: MsMemo
  onDelete: () => void
  handleEditMemo: (editedMemo: MsMemo, memoId: string) => Promise<void>
  memoIndex: string
  isMemoNameSetting?: boolean
  msData: MsWithPatientWithWeight
}

const SingleMsLiveMemo = React.forwardRef<HTMLLIElement, Props>(
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

    

    return (
      <li
        className="relative flex w-full items-center rounded-md px-2 mb-2"
        ref={ref}
        style={{
          backgroundColor: editedMemoColor ?? MEMO_COLORS[0],
        }}
      >
      

       

        <div className="group flex w-full gap-2 rounded-sm p-2 pt-1">
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center justify-between">
              {editedDoneTimestamp || isEditMode ? (
                <MsMemoTimeStamp
                  editedCreateTimestamp={
                    editedDoneTimestamp ?? new Date().toISOString()
                  }
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
                <div className="flex gap-1 text-xs text-muted-foreground">
                  대기중
                </div>
              )}

              {!isEditMode && (
                <div
                  className={cn(
                    'absolute right-1.5 top-1.5 flex cursor-pointer items-center gap-2 text-muted-foreground opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100',
                    isMemoNameSetting && 'hidden',
                  )}
                >
                  <PencilIcon
                    size={14}
                    onClick={() => setIsEditMode(true)}
                    className="hover:opacity-70"
                  />

                  <DeleteMemoDialog onDelete={onDelete} />
                </div>
              )}
            </div>

            {isEditMode ? (
              <div className="relative">
                <Textarea
                  value={editedMemo}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditedMemo(e.target.value)
                  }
                  className="min-h-8 overflow-hidden px-1 py-0.5 pr-7 text-sm"
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

                <MemoColorPicker
                  memoColor={editedMemoColor}
                  setMemoColor={setEditedMemoColor}
                />
                <CheckIcon
                  size={14}
                  onClick={handleUpdateSingleMemo}
                  className="absolute -top-5 right-0 cursor-pointer hover:opacity-70"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {memo.memo && (
                  <p className="mr-2 whitespace-pre-wrap break-all text-sm">
                    {memo.memo}
                  </p>
                )}
                
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
        </div>
      </li>
    )
  },
)

SingleMsLiveMemo.displayName = 'SingleMsTxMemo'

export default SingleMsLiveMemo

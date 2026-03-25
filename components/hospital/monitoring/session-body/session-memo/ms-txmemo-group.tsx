import NoResultSquirrel from '@/components/common/no-result-squirrel'
import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MEMO_COLORS } from '@/constants/hospital/icu/chart/colors'
import type { MemoColor } from '@/types/icu/chart'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { ReactSortable, type Sortable } from 'react-sortablejs'
import { toast } from 'sonner'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import SingleMsTxMemo from '@/components/hospital/monitoring/session-body/session-memo/single-ms-tx-memo'
import { updateMsMemo } from '@/lib/services/monitoring/update-ms'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { ClipboardListIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useMsMemoImageUpload } from '@/hooks/use-ms-memo-image-upload'
import { deleteMsMemoImage } from '@/lib/services/monitoring/delete-ms-memo-image'
import MsMemoImageUploadButtons from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-upload-buttons'
import MsMemoSchedulePicker from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-schedule-picker'
import { MsMemoSchedule } from '@/types/monitoring/monitoring-type'

type Props = {
  memo: MsMemo[]
  sessionId: string
  memoName: string
  msData: MsWithPatientWithWeight
}

export default function MsTxMemoGroup({
  memo,
  sessionId,
  memoName,
  msData,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [sortedMemos, setSortedMemos] = useState<MsMemo[]>(memo ?? [])
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[0])
  const [memoSchedule, setMemoSchedule] = useState<MsMemoSchedule | undefined>(undefined)
  const [isInputOpen, setIsInputOpen] = useState(false)

  const lastMemoRef = useRef<HTMLLIElement>(null)

  const { isUploading, cameraInputRef, galleryInputRef, handleFileUpload } =
    useMsMemoImageUpload({
      sessionId,
      onUploadComplete: async (urls) => await handleAddMemo(urls),
    })

  useEffect(() => {
    memo && setSortedMemos(memo)
  }, [memo])

  useEffect(() => {
    if (lastMemoRef.current) {
      lastMemoRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [sortedMemos])

  const handleUpdateDbMemo = async (updatedFilteredMemos: MsMemo[]) => {
    setIsUpdating(true)
    await updateMsMemo(sessionId, updatedFilteredMemos)
    setIsUpdating(false)
  }

  const handleReorderMemo = async (event: Sortable.SortableEvent) => {
    const { oldIndex, newIndex } = event
    const newOrder = [...sortedMemos]
    const [movedItem] = newOrder.splice(oldIndex as number, 1)
    newOrder.splice(newIndex as number, 0, movedItem)
    setSortedMemos(newOrder)
    await handleUpdateDbMemo(newOrder)
  }

  const handleAddMemo = async (imgUrls: string[] = []) => {
    if (memoInput.trim() === '' && imgUrls.length === 0) return

    const createdAt = new Date().toISOString()
    const uniqueId = `${createdAt}-${Math.random().toString(36).substring(2, 11)}`

    const newMemo: MsMemo = {
      id: uniqueId,
      memo: memoInput.trim(),
      check: '',
      create_timestamp: createdAt,
      color: memoColor as MemoColor,
      done_timestamp: null,
      is_done: false,
      is_realtime_memo: false,
      chosen: false,
      has_imgs: imgUrls.length > 0,
      img_url: imgUrls,
      schedule: memoSchedule,
    }

    const updatedMemos = [...sortedMemos, newMemo]
    setSortedMemos(updatedMemos)
    setMemoInput('')
    setMemoSchedule(undefined)
    await handleUpdateDbMemo(updatedMemos)
    toast.success('처치 항목을 추가했습니다')
  }

  const handleEditMemo = async (editedMemo: MsMemo, memoId: string) => {
    const editedMemos = sortedMemos.map((memo) =>
      memo.id === memoId ? editedMemo : memo,
    )
    setSortedMemos(editedMemos)
    await handleUpdateDbMemo(editedMemos)
    toast.success('메모를 수정하였습니다')
  }

  const handleDeleteMemo = async (memoId: string) => {
    const memoToDelete = sortedMemos.find((memo) => memo.id === memoId)
    if (memoToDelete && memoToDelete.has_imgs && memoToDelete.img_url) {
      await deleteMsMemoImage(memoToDelete.img_url)
    }
    const updatedEntries = sortedMemos.filter((memo) => memo.id !== memoId)
    setSortedMemos(updatedEntries)
    await handleUpdateDbMemo(updatedEntries)
    toast.success('메모를 삭제하였습니다')
  }

  const planMemos = sortedMemos.filter((m) => !m.is_realtime_memo)
  const pendingCount = planMemos.filter((m) => !m.is_done).length
  const doneCount = planMemos.filter((m) => m.is_done).length

  return (
    <div className="flex w-full flex-col rounded-xl border-2 border-blue-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b-2 border-blue-200">
        <div className="flex items-center gap-2">
          <ClipboardListIcon size={16} className="text-blue-600 shrink-0" />
          <span className="text-sm font-black text-blue-700">{memoName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="text-[10px] font-bold px-1.5 py-0 bg-orange-100 text-orange-600 border-orange-200"
          >
            대기 {pendingCount}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] font-bold px-1.5 py-0 bg-blue-100 text-blue-600 border-blue-200"
          >
            완료 {doneCount}
          </Badge>
          <button
            onClick={() => setIsInputOpen((v) => !v)}
            title={isInputOpen ? '입력창 닫기' : '항목 추가'}
            className="ml-1 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {isInputOpen ? <ChevronUpIcon size={13} /> : <PlusIcon size={13} />}
            {isInputOpen ? '닫기' : '항목 추가'}
          </button>
        </div>
      </div>

      {/* Memo List */}
      <ScrollArea className="h-56 bg-blue-50/20 p-2">
        <ReactSortable
          id="memo-tx"
          list={sortedMemos}
          setList={setSortedMemos}
          className="space-y-0"
          animation={250}
          handle=".handle"
          onEnd={handleReorderMemo}
          disabled={isUpdating}
        >
          {planMemos.length === 0 ? (
            <NoResultSquirrel
              text="처치 계획 없음"
              size="sm"
              className="h-48 flex-col font-normal text-blue-300"
            />
          ) : (
            planMemos.map((memo) => (
              <SingleMsTxMemo
                isMemoNameSetting={false}
                key={memo.id}
                memo={memo}
                memoIndex={memo.id}
                handleEditMemo={handleEditMemo}
                onDelete={() => handleDeleteMemo(memo.id)}
                msData={msData}
              />
            ))
          )}
        </ReactSortable>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Input — 기본 숨김, 토글로 표시 */}
      {isInputOpen && (
      <div className="relative border-t-2 border-blue-200">
        <Textarea
          disabled={isUpdating || isUploading}
          placeholder="처치 항목 추가 → Enter ⏎  |  줄바꿈 → Shift + Enter"
          id="memo-tx"
          value={memoInput}
          onChange={(e) => setMemoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAddMemo()
            }
          }}
          className="w-full rounded-none border-0 bg-white pl-3 pr-32 text-sm placeholder:text-xs placeholder:text-blue-300 focus-visible:ring-blue-200 resize-none"
        />
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
          <MsMemoSchedulePicker
            schedule={memoSchedule}
            onScheduleChange={setMemoSchedule}
            memos={sortedMemos}
            msData={msData}
          />
          <MsMemoImageUploadButtons
            isUploading={isUploading}
            cameraInputRef={cameraInputRef}
            galleryInputRef={galleryInputRef}
            handleFileUpload={handleFileUpload}
          />
          <MemoColorPicker
            memoColor={memoColor}
            setMemoColor={setMemoColor}
            className="static inset-auto"
          />
        </div>
      </div>
      )}
    </div>
  )
}

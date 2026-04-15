import NoResultSquirrel from '@/components/common/no-result-squirrel'
import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
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
import { toast } from 'sonner'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { useMsMemoImageUpload } from '@/hooks/use-ms-memo-image-upload'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { updateMsMemo } from '@/lib/services/monitoring/update-ms'
import SingleMsLiveMemo from '@/components/hospital/monitoring/session-body/session-memo/single-ms-live-memo'
import { deleteMsMemoImage } from '@/lib/services/monitoring/delete-ms-memo-image'
import MsMemoImageUploadButtons from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-image-upload-buttons'
import {
  ActivityIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import useIsMobile from '@/hooks/use-is-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Props = {
  memo: MsMemo[]
  sessionId: string
  memoName: string
  msData: MsWithPatientWithWeight
}

export default function MsLiveMemoGroup({
  memo,
  sessionId,
  memoName,
  msData,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [sortedMemos, setSortedMemos] = useState<MsMemo[]>(memo ?? [])
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[2])
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    setIsCollapsed(isMobile)
  }, [isMobile])

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
      done_timestamp: createdAt,
      is_done: true,
      is_realtime_memo: true,
      chosen: false,
      has_imgs: imgUrls.length > 0,
      img_url: imgUrls,
    }

    const updatedMemos = [...sortedMemos, newMemo]
    setSortedMemos(updatedMemos)
    setMemoInput('')
    await handleUpdateDbMemo(updatedMemos)
    toast.success('진행 상황을 기록했습니다')
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

  const liveMemos = sortedMemos.filter((m) => m.is_done)

  return (
    <div className="flex w-full flex-col rounded-xl border-2 border-emerald-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b-2 border-emerald-200">
        <div className="flex items-center gap-2">
          <ActivityIcon size={16} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-black text-emerald-700">{memoName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-200/50 hover:text-emerald-700 transition-colors"
                title="상세 보기"
              >
                <EyeIcon size={12} />
                자세히
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                <DialogTitle className="flex items-center gap-2 text-emerald-700 text-base font-bold">
                  <ActivityIcon size={18} />
                  {memoName} 전체 기록
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 bg-white overflow-y-auto">
                {liveMemos.length === 0 ? (
                  <NoResultSquirrel text="기록된 내용이 없습니다" size="md" />
                ) : (
                  <div className="relative pl-4">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-emerald-100" />
                    {liveMemos.map((memo, i) => (
                      <div key={memo.id + i} className="relative flex gap-3 mb-4">
                        <div className="absolute -left-4 top-[10px] h-2.5 w-2.5 rounded-full border-2 border-emerald-400 bg-white z-10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <SingleMsLiveMemo
                            isMemoNameSetting={false}
                            memo={memo}
                            memoIndex={memo.id}
                            handleEditMemo={handleEditMemo}
                            onDelete={() => handleDeleteMemo(memo.id)}
                            msData={msData}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Badge
            variant="secondary"
            className="text-[10px] font-bold px-1.5 py-0 bg-emerald-100 text-emerald-600 border-emerald-200"
          >
            {liveMemos.length}건 기록됨
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-emerald-600 hover:bg-emerald-100"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? '펼치기' : '접기'}
          >
            {isCollapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>

      {/* Timeline List */}
      <ScrollArea className="h-56 bg-emerald-50/20 p-2">
        {liveMemos.length === 0 ? (
          <NoResultSquirrel
            text="기록 없음"
            size="sm"
            className="h-48 flex-col font-normal text-emerald-300"
          />
        ) : (
          <div className="relative pl-4">
            {/* Vertical timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-emerald-200" />

            {liveMemos.map((memo, i) => (
              <div key={memo.id + i} className="relative flex gap-3 mb-1.5">
                {/* Timeline dot */}
                <div className="absolute -left-4 top-[10px] h-2.5 w-2.5 rounded-full border-2 border-emerald-400 bg-white z-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <SingleMsLiveMemo
                    isMemoNameSetting={false}
                    memo={memo}
                    memoIndex={memo.id}
                    handleEditMemo={handleEditMemo}
                    onDelete={() => handleDeleteMemo(memo.id)}
                    msData={msData}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <ScrollBar orientation="vertical" />
      </ScrollArea>

    
        </>
        
      )}
        {/* Input */}
      <div className="relative border-t-2 border-emerald-200">
        <Textarea
          disabled={isUpdating || isUploading}
          placeholder="지금 발생한 일을 기록하세요 → Enter ⏎  |  줄바꿈 → Shift + Enter"
          id="memo-live"
          value={memoInput}
          onChange={(e) => setMemoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAddMemo()
            }
          }}
          className="w-full rounded-none border-0 bg-white pl-3 pr-32 text-sm placeholder:text-xs placeholder:text-emerald-300 focus-visible:ring-emerald-200 resize-none"
        />
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
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
          <Button
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            onClick={() => handleAddMemo()}
            disabled={isUpdating || isUploading || !memoInput.trim()}
          >
            입력
          </Button>
        </div>
      </div>
    </div>
  )
}

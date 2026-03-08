import NoResultSquirrel from '@/components/common/no-result-squirrel'
import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { MEMO_COLORS } from '@/constants/hospital/icu/chart/colors'
import type { MemoColor } from '@/types/icu/chart'
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { ReactSortable, type Sortable } from 'react-sortablejs'
import { toast } from 'sonner'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import SingleMsTxMemo from '@/components/hospital/monitoring/session-body/session-memo/single-ms-tx-memo'
import { updateMsMemo } from '@/lib/services/monitoring/update-ms'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'



type Props = {
  memo: MsMemo[]
//   setMemos: Dispatch<SetStateAction<MsMemo[]>>
  sessionId: string
  memoName: string
  msData: MsWithPatientWithWeight
}

export default function MsTxMemoGroup({
  memo,
//   setMemos,
  sessionId,
  memoName,
  msData,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [sortedMemos, setSortedMemos] = useState<MsMemo[]>(memo ?? [])
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[0])

  const lastMemoRef = useRef<HTMLLIElement>(null)

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
    const { from, to, oldIndex, newIndex } = event

    const newOrder = [...sortedMemos]
    const [movedItem] = newOrder.splice(oldIndex as number, 1)
    newOrder.splice(newIndex as number, 0, movedItem)

    setSortedMemos(newOrder)
    await handleUpdateDbMemo(newOrder)
  }

  const handleAddMemo = async () => {
    if (memoInput.trim() === '') return

    const createdAt = new Date().toISOString()
    const uniqueId = `${createdAt}-${Math.random().toString(36).substring(2, 11)}`

    const newMemo: MsMemo = {
      id: uniqueId,
      memo: memoInput.trim(),
      check:'',
      create_timestamp: createdAt,
      color: memoColor as MemoColor,
      done_timestamp: null,
      is_done: false,
      is_realtime_memo: false,
      chosen: false,
      has_imgs: false,
      img_url: [],
    }
   
    const updatedMemos = [...sortedMemos, newMemo]

    setSortedMemos(updatedMemos)
    setMemoInput('')

    await handleUpdateDbMemo(updatedMemos)

    toast.success(`${memoName}에 새 메모를 추가했습니 다`)
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
    const updatedEntries = sortedMemos.filter(
      (memo) => memo.id !== memoId,
    )
    setSortedMemos(updatedEntries)

    await handleUpdateDbMemo(updatedEntries)

    toast.success('메모를 삭제하였습니다')
  }

  return (
    <div className="relative flex w-full flex-col">
      <Label
        className="mb-1 ml-2 text-xs text-muted-foreground"
        htmlFor={`memo-tx`}
      >
        {memoName} ({sortedMemos.length})
      </Label>

      <ScrollArea className="h-60 rounded-t-md border p-2">
        <ReactSortable
          id="memo-tx"
          list={sortedMemos}
          setList={setSortedMemos}
          className="space-y-2"
          animation={250}
          handle=".handle"
          onEnd={handleReorderMemo}
          disabled={isUpdating}
        >
          {sortedMemos.filter((memo) => !memo.is_realtime_memo).length === 0 ? (
            <NoResultSquirrel
              text="처치 정보 없음"
              size="sm"
              className="h-52 flex-col font-normal text-muted-foreground"
            />
          ) : (
            sortedMemos.filter((memo) => !memo.is_realtime_memo).map((memo) => (
              <SingleMsTxMemo
                isMemoNameSetting={false}
                key={memo.id}
                memo={memo}
                memoIndex={memo.id}
                handleEditMemo={handleEditMemo}
                onDelete={() => handleDeleteMemo(memo.id)}
                msData={msData}
                // ref={memo.id === sortedMemos.length - 1 ? lastMemoRef : null}
              />
            ))
          )}
         </ReactSortable>
        <ScrollBar orientation="vertical" />
        
      </ScrollArea>

      <div className="relative">
        <Textarea
          disabled={isUpdating}
          placeholder="줄 추가 : Shift + Enter ⏎"
          id={`memo-tx`}
          value={memoInput}
          onChange={(e) => setMemoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAddMemo()
            }
          }}
          className="w-full rounded-none rounded-b-md border-t-0 pr-7 text-sm placeholder:text-xs"
        />

        <MemoColorPicker memoColor={memoColor} setMemoColor={setMemoColor} />
      </div>
    </div>
  )
}

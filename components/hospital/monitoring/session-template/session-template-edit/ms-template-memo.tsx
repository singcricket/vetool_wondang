'use client'

import MemoColorPicker from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-memos/memo-color-picker'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { MEMO_COLORS } from '@/constants/hospital/icu/chart/colors'
import type { MemoColor } from '@/types/icu/chart'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { CheckIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { type Dispatch, type SetStateAction, useState } from 'react'

type Props = {
  memos: MsMemo[]
  setMemos: Dispatch<SetStateAction<MsMemo[]>>
}

// ── 개별 메모 아이템 (인라인 편집 포함) ──
function MemoItem({
  memo,
  onDelete,
  onEdit,
}: {
  memo: MsMemo
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(memo.memo)

  const handleSave = () => {
    if (editText.trim() === '') return
    onEdit(memo.id, editText.trim())
    setIsEditing(false)
  }

  return (
    <div
      className="flex items-start gap-2 rounded-md border p-2 text-sm"
      style={{ borderLeftColor: memo.color, borderLeftWidth: 3 }}
    >
      {isEditing ? (
        <>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSave()
              }
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="flex-1 min-h-[60px] resize-none text-sm"
            autoFocus
          />
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
          <span
            className="flex-1 cursor-pointer whitespace-pre-wrap break-words"
            onClick={() => setIsEditing(true)}
          >
            {memo.memo}
          </span>
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
  )
}

// ── 메인 컴포넌트 ──
export default function MsTemplateMemo({ memos, setMemos }: Props) {
  const [memoInput, setMemoInput] = useState('')
  const [memoColor, setMemoColor] = useState<MemoColor>(MEMO_COLORS[0])

  const handleAddMemo = () => {
    if (memoInput.trim() === '') return
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
      has_imgs: false,
      img_url: [],
    }
    setMemos((prev) => [...prev, newMemo])
    setMemoInput('')
  }

  const handleDeleteMemo = (id: string) =>
    setMemos((prev) => prev.filter((m) => m.id !== id))

  const handleEditMemo = (id: string, newText: string) =>
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, memo: newText } : m)),
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
          className="w-full rounded-none rounded-b-md border-t-0 pr-7 text-sm placeholder:text-xs"
        />
        <MemoColorPicker memoColor={memoColor} setMemoColor={setMemoColor} />
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, NotebookPenIcon } from 'lucide-react'
import { updateEchoMemo } from '@/lib/services/echocardio/update-echo'
import { Button } from '@/components/ui/button'

type Props = {
  echoId: string
  memo: string | null
}

export default function EchoMemo({ echoId, memo }: Props) {
  const [value, setValue] = useState(memo ?? '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    setValue(memo ?? '')
  }, [memo])

  const handleBlur = async () => {
    if (memo === value.trim()) return
    setIsUpdating(true)
    await updateEchoMemo(echoId, value.trim())
    setIsUpdating(false)
  }

  return (
    <div className="flex flex-col gap-1.5 overflow-hidden rounded-md border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-muted/50 px-3 py-1.5 transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          <NotebookPenIcon size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-slate-700">종합 소견 및 약물</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="p-2 pt-0 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <Textarea
            id="echo-memo"
            placeholder="심초음파 종합 소견 및 특이사항, 처방 등에 대해 입력..."
            disabled={isUpdating}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            className="min-h-[280px] w-full resize-y border-none p-1 text-sm shadow-none focus-visible:ring-0 leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}

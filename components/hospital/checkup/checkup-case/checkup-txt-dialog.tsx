'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, FileCode2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { buildCheckupText } from '@/lib/utils/checkup/build-checkup-text'
import type { CheckupSection } from '@/types/hospital/checkup-type'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: CheckupSection[]
  patientName: string
  checkupDate: string
}

export default function CheckupTxtDialog({ open, onOpenChange, sections, patientName, checkupDate }: Props) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setText(buildCheckupText(sections))
    }
  }, [open, sections])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select all
      const el = document.getElementById('checkup-txt-area') as HTMLTextAreaElement | null
      el?.select()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileCode2 size={15} className="text-teal-600" />
            검사 결과 텍스트 — {patientName} ({checkupDate})
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <Textarea
            id="checkup-txt-area"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[420px] resize-none font-mono text-xs leading-relaxed text-slate-700"
            spellCheck={false}
          />
        </div>

        <div className="shrink-0 flex items-center justify-between border-t bg-slate-50 px-5 py-3">
          <p className="text-[11px] text-slate-400">직접 편집 후 복사할 수 있습니다</p>
          <Button
            onClick={handleCopy}
            size="sm"
            className={`gap-1.5 text-xs ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? '복사됨' : '클립보드 복사'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

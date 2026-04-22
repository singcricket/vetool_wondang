'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'

type Props = {
  generalNote: string
  onGeneralNoteChange: (v: string) => void
}

export default function DentalMemo({ generalNote, onGeneralNoteChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">일반 메모</span>
      </div>
      <Textarea
        value={generalNote}
        onChange={(e) => onGeneralNoteChange(e.target.value)}
        rows={6}
        className="resize-none text-sm focus-visible:ring-1"
        placeholder="차트 전반에 대한 특이사항이나 메모를 입력하세요."
      />
    </div>
  )
}

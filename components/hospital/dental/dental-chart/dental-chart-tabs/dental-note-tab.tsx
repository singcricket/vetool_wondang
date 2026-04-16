'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = { chartDetail: DentalChartDetail; hosId: string }

function TagInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')

  function addTag() {
    const tag = input.trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1 rounded border bg-white p-2 min-h-[38px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive">
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder="태그 입력 후 Enter"
          className="h-7 text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-7 text-xs">추가</Button>
      </div>
    </div>
  )
}

export default function DentalNoteTab({ chartDetail, hosId }: Props) {
  const { refresh } = useRouter()
  const [isPending, startTransition] = useTransition()

  const [userTags, setUserTags] = useState<string[]>(
    chartDetail.user_tags ? chartDetail.user_tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  )
  const [tags, setTags] = useState<string[]>(
    chartDetail.tags ? chartDetail.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  )
  const [generalNote, setGeneralNote] = useState(chartDetail.general_note ?? '')

  function handleSave() {
    startTransition(async () => {
      await updateDentalChart(chartDetail.id, hosId, {
        user_tags: userTags.join(',') || null,
        tags: tags.join(',') || null,
        general_note: generalNote || null,
      })
      refresh()
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6 pb-20">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">태그</p>
            <TagInput label="사용자 태그 (user_tags)" value={userTags} onChange={setUserTags} />
            <TagInput label="시스템 태그 (tags)" value={tags} onChange={setTags} />
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">일반 메모</p>
            <Textarea
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              rows={8}
              className="text-sm"
              placeholder="차트 전반에 대한 자유 기재 메모"
            />
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 flex justify-end border-t bg-background px-4 py-3">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}

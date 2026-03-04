'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateMsTitle } from '@/lib/services/monitoring/update-ms'
import { ClipboardListIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  title: string | null
  sessionId: string
}

export default function MsTitle({ title, sessionId }: Props) {
  const [titleInput, setTitleInput] = useState(title??"")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateClTitle = async () => {
    if (title!=="" && title === titleInput.trim()) {
      setTitleInput(titleInput.trim())
      return
    }

    setIsUpdating(true)

    await updateMsTitle(sessionId, titleInput.trim())

    toast.success('체크리스트명을 변경하였습나다')

    setIsUpdating(false)
  }

  useEffect(() => {
    setTitleInput(title??"")
  }, [title])

  return (
    <div className="relative flex items-center">
      <Label
        className="absolute left-2 text-xs text-muted-foreground"
        htmlFor="title"
      >
        <ClipboardListIcon size={16} className="text-muted-foreground" />
      </Label>

      <Input
        placeholder="체크리스트명"
        disabled={isUpdating}
        id="title"
        value={titleInput}
        onChange={(e) => setTitleInput(e.target.value)}
        onBlur={handleUpdateClTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-full pl-8"
        title={title ?? '미등록'}
      />
    </div>
  )
}

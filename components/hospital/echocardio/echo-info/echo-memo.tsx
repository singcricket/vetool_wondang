'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NotebookPenIcon } from 'lucide-react'
import { updateEchoMemo } from '@/lib/services/echocardio/update-echo'

type Props = {
  echoId: string
  memo: string | null
}

export default function EchoMemo({ echoId, memo }: Props) {
  const [value, setValue] = useState(memo ?? '')
  const [isUpdating, setIsUpdating] = useState(false)

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
    <div className="relative flex items-center">
      <Label className="absolute left-2 text-xs text-muted-foreground" htmlFor="echo-memo">
        <NotebookPenIcon size={16} className="text-muted-foreground" />
      </Label>
      <Input
        id="echo-memo"
        placeholder="메모"
        disabled={isUpdating}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-full pl-8"
      />
    </div>
  )
}

'use client'

import SubmitButton from '@/components/common/submit-button'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { updateMsPannedVitals } from '@/lib/services/monitoring/update-ms'
import { cn } from '@/lib/utils/utils'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  sessionId: string
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
  selectedVitals: string[]
  setSelectedVitals: Dispatch<SetStateAction<string[]>>
  clNames: string[]
}

export default function MsClSelectForm({
  sessionId,
  setIsDialogOpen,
  selectedVitals,
  setSelectedVitals,
  clNames,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleVital = (item: string, checked: boolean) => {
    if (checked) {
      setSelectedVitals((prev) => [...prev, item])
    } else {
      setSelectedVitals((prev) => prev.filter((v) => v !== item))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: DB update 기능은 추후 구현 (요청에 의해 제외)
  

     const updatems = await updateMsPannedVitals(sessionId, selectedVitals)
    // console.log(values.groupList)
    if (updatems) {
      toast.success('그룹을 변경하였습니다')
    } else {
      toast.error('그룹 변경에 실패하였습니다')
    }
    setIsSubmitting(false)
    setIsDialogOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {clNames.map((item) => (
          <div key={item} className="flex flex-row items-center gap-2">
            <Checkbox
              id={`vital-${item}`}
              checked={selectedVitals.includes(item)}
              onCheckedChange={(checked) => handleToggleVital(item, !!checked)}
            />
            <Label
              className="cursor-pointer text-sm font-normal"
              htmlFor={`vital-${item}`}
            >
              {item}
            </Label>
          </div>
        ))}
      </div>

      <DialogFooter className={cn('mt-4')}>
        <DialogClose asChild>
          <Button tabIndex={-1} variant="outline" size="sm">
            닫기
          </Button>
        </DialogClose>

        <SubmitButton buttonText="수정" isPending={isSubmitting} />
      </DialogFooter>
    </form>
  )
}

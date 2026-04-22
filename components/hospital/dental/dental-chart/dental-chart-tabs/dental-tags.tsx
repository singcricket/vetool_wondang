'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Autocomplete from '@/components/common/auto-complete/auto-complete'
import GroupBadge from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/group/group-badge'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'
import type { DentalChartDetail } from '@/types/dental/dental-type'

type Props = {
  userTags: string
  onUserTagsChange: (v: string) => void
}

export default function DentalTags({ userTags, onUserTagsChange }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [preTags, setPreTags] = useState(userTags)

  const handleUpdate = async (value: string) => {
    setPreTags(value.trim())
  }

  const handleApply = () => {
    onUserTagsChange(preTags)
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          variant="outline"
          className="flex w-full items-center justify-start gap-2 px-2 h-10"
        >
          {(!userTags || userTags.length === 0) && (
            <span className="text-muted-foreground text-sm">태그</span>
          )}
          <GroupBadge currentGroups={userTags?.split(',') ?? []} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>태그 수정</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <Autocomplete
          label="태그"
          defaultValue={userTags ?? ''}
          handleUpdate={handleUpdate}
          isUpdating={false}
        />
        
        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>취소</Button>
          <Button size="sm" onClick={handleApply}>적용</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

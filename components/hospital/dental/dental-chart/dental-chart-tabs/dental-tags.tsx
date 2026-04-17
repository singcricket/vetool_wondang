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
  chartDetail: DentalChartDetail
  hosId: string
}

export default function DentalTags({ chartDetail, hosId }: Props) {
  const { id: chartId, user_tags, patient } = chartDetail
  const { refresh } = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [preTags, setPreTags] = useState(user_tags ?? '')

  const handleUpdate = async (value: string) => {
    setPreTags(value.trim())
  }

  const saveTags = async () => {
    setIsUpdating(true)
    
    // 시스템 태그(tags) 재생생 로직 (검색용)
    // #hos_patient_id#hos_owner_id#name#species#breed#gender#age_days
    const ageDays = Math.floor(
      (Date.now() - new Date(patient.birth ?? '').getTime()) / (1000 * 60 * 60 * 24),
    )
    const systemTags = `#${patient.hos_patient_id}#${patient.hos_owner_id ?? ''}#${patient.name}#${patient.species}#${patient.breed}#${patient.gender}#${ageDays}`

    try {
      await updateDentalChart(chartId, hosId, {
        user_tags: preTags || null,
        tags: systemTags
      })
      toast.success('태그를 변경하였습니다')
      setIsDialogOpen(false)
      refresh()
    } catch (error) {
      console.error(error)
      toast.error('변경에 실패하였습니다')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          variant="outline"
          className="flex w-full items-center justify-start gap-2 px-2 h-10"
        >
          {(!user_tags || user_tags.length === 0) && (
            <span className="text-muted-foreground text-sm">태그</span>
          )}
          <GroupBadge currentGroups={user_tags?.split(',') ?? []} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>태그 수정</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <Autocomplete
          label="태그"
          defaultValue={user_tags ?? ''}
          handleUpdate={handleUpdate}
          isUpdating={isUpdating}
        />
        
        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>취소</Button>
          <Button size="sm" onClick={saveTags} disabled={isUpdating}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

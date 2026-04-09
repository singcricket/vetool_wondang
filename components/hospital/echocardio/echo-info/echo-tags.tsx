'use client'

import Autocomplete from '@/components/common/auto-complete/auto-complete'
import GroupBadge from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/group/group-badge'
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
import { updateEchoTag } from '@/lib/services/echocardio/update-echo'
import { useState } from 'react'
import { toast } from 'sonner'
import { EchoChartWithPatient } from '@/types/echocardio/echocardio-type'
import { getDaysSince } from '@/lib/utils/utils'

type Props = {
  echoId: string
  userTags: string | null
  chartDetail: EchoChartWithPatient
}

export default function EchoTags({ userTags, echoId, chartDetail }: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // TEMPLATE_ID: 메타데이터가 user_tags에 남아있는 경우 필터링
  const filteredUserTags = userTags
    ?.split(',')
    .filter((t) => !t.trim().startsWith('TEMPLATE_ID:'))
    .join(',')

  const [preTags, setPreTags] = useState(filteredUserTags ?? '')

  const handleUpdate = async (value: string) => {
    const trimmedValue = value.trim()
    if (filteredUserTags === trimmedValue) return
    setPreTags(trimmedValue)
  }

  const saveTags = async () => {
    const trimmedValue = preTags.trim()

    if (userTags === trimmedValue && trimmedValue !== '') {
      setIsDialogOpen(false)
      return
    }

    setIsUpdating(true)

    // 현재 입력된 값을 콤마로 분리하여 배열로 만듬
    const keywordsArray = trimmedValue
      .split(',')
      .map((t) => {
        const trimmed = t.trim()
        const match = trimmed.match(/\(([^)]+)\)/)
        return match ? match[1].trim() : trimmed
      })
      .filter((t) => t.length > 0)

    const hosPatientId = chartDetail.patient?.hos_patient_id ?? ''
    const hosOwnerId = chartDetail.patient?.hos_owner_id ?? ''
    const patientName = chartDetail.patient?.name ?? ''
    const patientGender = chartDetail.patient?.gender ?? ''
    const patientSpecies = chartDetail.patient?.species ?? ''
    const patientBreed = chartDetail.patient?.breed ?? ''
    const ageInDays = String(getDaysSince(chartDetail.patient?.birth ?? ''))

    const success = await updateEchoTag(
      echoId,
      preTags ?? '',
      keywordsArray,
      hosPatientId,
      hosOwnerId,
      patientName,
      patientGender,
      patientSpecies,
      patientBreed,
      ageInDays,
    )

    if (success) {
      toast.success('태그를 변경하였습니다')
      setIsDialogOpen(false)
    }

    setIsUpdating(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          variant="outline"
          className="flex w-full items-center justify-start gap-2 px-2 h-10"
        >
          {(!filteredUserTags || filteredUserTags.length === 0) && (
            <span className="text-muted-foreground">태그</span>
          )}
          <GroupBadge currentGroups={filteredUserTags?.split(',') ?? []} />
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
          isUpdating={isUpdating}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
          <Button onClick={() => saveTags()} disabled={isUpdating}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

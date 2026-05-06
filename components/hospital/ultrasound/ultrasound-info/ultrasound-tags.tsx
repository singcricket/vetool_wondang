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
import { updateUltrasoundTag } from '@/lib/services/ultrasound/ultrasound-charts'
import { useState } from 'react'
import { toast } from 'sonner'
import { UltrasoundChartDetail } from '@/types/hospital/ultrasound-type'
import { getDaysSince } from '@/lib/utils/utils'

type Props = {
  chartId: string
  tags: string | null
  chartDetail: UltrasoundChartDetail
}

export default function UltrasoundTags({ tags, chartId, chartDetail }: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 시스템 태그(#환자번호 등)를 제외한 순수 사용자 태그만 필터링 (간이 처리)
  const userTagsOnly = tags
    ?.split('#')
    .filter((t) => {
      const trimmed = t.trim()
      if (trimmed.length === 0) return false
      // 환자 정보와 일치하는 태그는 제외 (매우 단순한 로직)
      if (trimmed === chartDetail.patient?.hos_patient_id) return false
      if (trimmed === chartDetail.patient?.hos_owner_id) return false
      if (trimmed === chartDetail.patient?.name) return false
      if (trimmed === chartDetail.patient?.species) return false
      if (trimmed === chartDetail.patient?.breed) return false
      if (trimmed === chartDetail.patient?.gender) return false
      if (!isNaN(Number(trimmed))) return false // 나이(일수) 등 숫자 제외
      return true
    })
    .join(',')

  const [preTags, setPreTags] = useState(userTagsOnly ?? '')

  const handleUpdate = async (value: string) => {
    const trimmedValue = value.trim()
    if (userTagsOnly === trimmedValue) return
    setPreTags(trimmedValue)
  }

  const saveTags = async () => {
    const trimmedValue = preTags.trim()

    setIsUpdating(true)

    const keywordsArray = trimmedValue
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const hosPatientId = chartDetail.patient?.hos_patient_id ?? ''
    const hosOwnerId = chartDetail.patient?.hos_owner_id ?? ''
    const patientName = chartDetail.patient?.name ?? ''
    const patientGender = chartDetail.patient?.gender ?? ''
    const patientSpecies = chartDetail.patient?.species ?? ''
    const patientBreed = chartDetail.patient?.breed ?? ''
    const ageInDays = String(getDaysSince(chartDetail.patient?.birth ?? ''))

    const success = await updateUltrasoundTag(
      chartId,
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
          className="flex w-full items-center justify-start gap-2 px-2 h-10 overflow-hidden"
        >
          {(!userTagsOnly || userTagsOnly.length === 0) && (
            <span className="text-muted-foreground">태그</span>
          )}
          <GroupBadge currentGroups={userTagsOnly?.split(',') ?? []} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>태그 수정</DialogTitle>
          <DialogDescription>
            차트를 구분할 수 있는 태그를 입력하세요. (쉼표로 구분)
          </DialogDescription>
        </DialogHeader>

        <Autocomplete
          label="태그"
          defaultValue={userTagsOnly ?? ''}
          handleUpdate={handleUpdate}
          isUpdating={isUpdating}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
          <Button onClick={() => saveTags()} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700">
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

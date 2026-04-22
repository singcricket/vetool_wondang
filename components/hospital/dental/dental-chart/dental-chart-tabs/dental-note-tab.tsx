'use client'

import { useState, useEffect } from 'react'
import type { DentalChartDetail } from '@/types/dental/dental-type'
import { getStaffs, type Staff } from '@/lib/services/admin/staff'
import DentalVets from './dental-vets'
import DentalTags from './dental-tags'
import DentalMemo from './dental-memo'
import { ScrollArea } from '@/components/ui/scroll-area'

type Props = {
  chartDetail: DentalChartDetail
  hosId: string
  vetId: any
  onVetIdChange: (v: any[]) => void
  userTags: string
  onUserTagsChange: (v: string) => void
  generalNote: string
  onGeneralNoteChange: (v: string) => void
}

export default function DentalNoteTab({
  chartDetail,
  hosId,
  vetId,
  onVetIdChange,
  userTags,
  onUserTagsChange,
  generalNote,
  onGeneralNoteChange,
}: Props) {
  const [staffs, setStaffs] = useState<Staff[]>([])

  useEffect(() => {
    async function fetchStaffs() {
      const data = await getStaffs(hosId)
      setStaffs(data)
    }
    fetchStaffs()
  }, [hosId])

  return (
    <div className="bg-slate-50/10">
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        {/* 상단 정보 영역 (인원 설정 및 태그) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">의료진 구성</span>
            <DentalVets
              vetId={vetId}
              staffs={staffs}
              onVetIdChange={onVetIdChange}
            />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">차트 태그</span>
            <DentalTags
              userTags={userTags}
              onUserTagsChange={onUserTagsChange}
            />
          </div>
        </div>

        {/* 하단 메모 영역 */}
        <div className="mt-2">
          <DentalMemo
            generalNote={generalNote}
            onGeneralNoteChange={onGeneralNoteChange}
          />
        </div>
      </div>
    </div>
  )
}

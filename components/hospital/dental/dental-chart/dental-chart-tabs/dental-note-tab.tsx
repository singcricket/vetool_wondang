'use client'

import { useState, useEffect } from 'react'
import type { DentalChartDetail } from '@/types/dental/dental-type'
import { getStaffs, type Staff } from '@/lib/services/admin/staff'
import DentalVets from './dental-vets'
import DentalTags from './dental-tags'
import DentalMemo from './dental-memo'
import { ScrollArea } from '@/components/ui/scroll-area'

type Props = { chartDetail: DentalChartDetail; hosId: string }

export default function DentalNoteTab({ chartDetail, hosId }: Props) {
  const [staffs, setStaffs] = useState<Staff[]>([])

  useEffect(() => {
    async function fetchStaffs() {
      const data = await getStaffs(hosId)
      setStaffs(data)
    }
    fetchStaffs()
  }, [hosId])

  return (
    <div className="flex flex-col h-full bg-slate-50/10">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4 lg:p-6">
          {/* 상단 정보 영역 (인원 설정 및 태그) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">의료진 구성</span>
              <DentalVets
                chartId={chartDetail.id}
                hosId={hosId}
                vetId={chartDetail.vet_id}
                staffs={staffs}
              />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">차트 태그</span>
              <DentalTags
                chartDetail={chartDetail}
                hosId={hosId}
              />
            </div>
          </div>

          {/* 하단 메모 영역 */}
          <div className="mt-2">
            <DentalMemo
              chartId={chartDetail.id}
              hosId={hosId}
              memo={chartDetail.general_note}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

'use client'

import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InfoIcon, ClipboardListIcon, ActivityIcon } from 'lucide-react'

import MsInfoContainer from '@/components/hospital/monitoring/session-body/session-info/session-info-container'
import MsClContainer from '@/components/hospital/monitoring/session-body/session-checklist/ms-cl-container'
import MsTxMemoGroup from '@/components/hospital/monitoring/session-body/session-memo/ms-txmemo-group'
import MsLiveMemoGroup from '@/components/hospital/monitoring/session-body/session-memo/ms-livememo-group'
import { MsMemo } from '@/types/monitoring/monitoring-type'

type Props = {
  msData: MsWithPatientWithWeight
  targetDate: string
  hosId: string
  isVet: boolean
}

export default function SessionBody({
  msData,
  targetDate,
  hosId,
  isVet,
}: Props) {
  const [memos, setMemos] = useState<MsMemo[]>(msData.memo_tx)

  useEffect(() => {
    const sorted = [...msData.memo_tx].sort((a, b) => {
      const timeA = a.done_timestamp ? new Date(a.done_timestamp).getTime() : 0
      const timeB = b.done_timestamp ? new Date(b.done_timestamp).getTime() : 0
      return timeB - timeA
    })

    setMemos(sorted)
  }, [msData.memo_tx])

  return (
    <div className="mt-4 flex w-full flex-col gap-2 p-2 pb-32">
      <Tabs defaultValue="tx" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-blue-100/50">
          <TabsTrigger 
            value="tx" 
            className="text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
          >
            기본정보 / 처치계획
          </TabsTrigger>
          <TabsTrigger 
            value="cl" 
            className="text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
          >
            체크리스트
          </TabsTrigger>
          <TabsTrigger 
            value="live" 
            className="text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
          >
            실시간 기록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tx" className="mt-4 flex flex-col gap-4 outline-none">
          <MsInfoContainer msData={msData} />
          <MsTxMemoGroup
            memo={memos}
            sessionId={msData.session_id}
            memoName="처치 정보 / 계획"
            msData={msData}
            isVet={isVet}
          />
        </TabsContent>

        <TabsContent value="cl" className="mt-4 outline-none">
          <MsClContainer msData={msData} />
        </TabsContent>

        <TabsContent value="live" className="mt-4 outline-none">
          <MsLiveMemoGroup
            memo={memos}
            sessionId={msData.session_id}
            memoName="실시간 기록"
            msData={msData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsTxMemoGroup from '@/components/hospital/monitoring/session-body/session-memo/ms-txmemo-group'
import MsLiveMemoGroup from '@/components/hospital/monitoring/session-body/session-memo/ms-livememo-group'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { useEffect, useState } from 'react'

export default function MsMemoContainer({
  msData,
}: {
  msData: MsWithPatientWithWeight
}) {
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
    <div className="flex flex-wrap gap-2">
      <div className="w-full md:w-[calc(50%-0.25rem)]">
        <MsTxMemoGroup
          memo={memos}
          sessionId={msData.session_id}
          memoName="처치 및 추가정보"
          msData={msData}
        />
      </div>
      <div className="w-full md:w-[calc(50%-0.25rem)]">
        <MsLiveMemoGroup
          memo={memos}
          sessionId={msData.session_id}
          memoName="실시간 진행 상황"
          msData={msData}
        />
      </div>
    </div>
  )
}

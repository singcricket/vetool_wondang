'use client'

import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'


export default function MsMemoContainer({
  msData,
}: {
  msData: MsWithPatientWithWeight
}) {
  return (
   <div className="relative">
      
        {/* <div className="grid grid-cols-2 gap-2">
          <ClTxMemoGroup
            memo={memos.a}
            memos={memos}
            setMemos={setMemos}
            memoId="a"
            checklistId={checklistId}
            memoName="처치정보"
          />

          <ClTxMemoGroup
            memo={memos.b}
            memos={memos}
            setMemos={setMemos}
            memoId="b"
            checklistId={checklistId}
            memoName="주의사항"
          />
        </div>
       */}

    
    </div>
  )
}

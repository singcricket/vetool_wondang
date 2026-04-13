'use client'

import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsTxMemoGroup from '@/components/hospital/monitoring/session-body/session-memo/ms-txmemo-group'
import MsLiveMemoGroup from '@/components/hospital/monitoring/session-body/session-memo/ms-livememo-group'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ClipboardListIcon, PlusIcon, Edit3Icon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { updateMsMemo } from '@/lib/services/monitoring/update-ms'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils/utils'
import MsTxMemoSimplifiedResult from './ms-txmemo-simplified-result'

export default function MsMemoContainer({
  msData,
  isVet,
}: {
  msData: MsWithPatientWithWeight
  isVet: boolean
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

  const planMemos = memos.filter((m) => !m.is_realtime_memo)

  const handleToggleDone = async (memoToToggle: MsMemo) => {
    const isDone = !!memoToToggle.done_timestamp
    const newTimestamp = isDone ? null : new Date().toISOString()
    
    // 로컬 상태 즉시 업데이트 (반응성)
    const updatedMemos = memos.map(m => 
      m.id === memoToToggle.id 
        ? { ...m, done_timestamp: newTimestamp, is_done: !isDone }
        : m
    )
    setMemos(updatedMemos)

    // DB 동기화
    await updateMsMemo(msData.session_id, updatedMemos)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 처치 계획이 아직 없을 때 수의사에게만 보이는 생성 버튼 (위아래 배치) */}
      {isVet && (
        <Dialog>
          {planMemos.length === 0 && (
            <div className="flex justify-start py-2">
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm"
                >
                  <PlusIcon size={16} />
                  처치 정보 / 계획 작성
                </Button>
              </DialogTrigger>
            </div>
          )}
          <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="hidden">
              <DialogTitle>처치 정보 / 계획 생성</DialogTitle>
            </DialogHeader>
            <MsTxMemoGroup
              memo={memos}
              sessionId={msData.session_id}
              memoName="처치 정보 / 계획 생성"
              msData={msData}
              isVet={isVet}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-wrap gap-3">
        {/* 생성된 처치 계획 결과 표시 (컴포넌트로 분리) */}
        {planMemos.length > 0 && (
          <MsTxMemoSimplifiedResult
            memos={memos}
            planMemos={planMemos}
            msData={msData}
            isVet={isVet}
            handleToggleDone={handleToggleDone}
          />
        )}

        {/* 실시간 기록 패널 */}
        <div
          className={
            planMemos.length > 0
              ? 'w-full md:w-[calc(50%-0.375rem)]'
              : 'w-full'
          }
        >
          <MsLiveMemoGroup
            memo={memos}
            sessionId={msData.session_id}
            memoName="실시간 기록"
            msData={msData}
          />
        </div>
      </div>
    </div>
  )
}

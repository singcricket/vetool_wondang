'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ClipboardListIcon,
  Edit3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils/utils'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsTxMemoGroup from './ms-txmemo-group'

type Props = {
  memos: MsMemo[]
  planMemos: MsMemo[]
  msData: MsWithPatientWithWeight
  isVet: boolean
  handleToggleDone: (memo: MsMemo) => Promise<void>
}

export default function MsTxMemoSimplifiedResult({
  memos,
  planMemos,
  msData,
  isVet,
  handleToggleDone,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="w-full md:w-[calc(50%-0.375rem)]">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-blue-100 bg-white shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <ClipboardListIcon size={16} className="text-blue-600" />
            <span className="text-sm font-black text-slate-700">처치 계획</span>
          </div>

          <div className="flex items-center gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Edit3Icon size={13} />
                  수정 / 관리
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="hidden">
                  <DialogTitle>수정</DialogTitle>
                </DialogHeader>
                <MsTxMemoGroup
                  memo={memos}
                  sessionId={msData.session_id}
                  memoName="처치 정보 / 계획 수정"
                  msData={msData}
                  isVet={isVet}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-600 hover:bg-blue-100"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? '펼치기' : '접기'}
            >
              {isCollapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
            </Button>
          </div>
        </div>

        {/* 리스트 본문 */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto max-h-[400px] bg-white scrollbar-hide p-2">
            <div className="flex flex-col gap-1.5">
              {planMemos.map((m) => {
                const isDone = !!m.done_timestamp
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-start gap-3 p-2.5 rounded-lg border transition-all',
                      isDone
                        ? 'bg-slate-50 border-transparent opacity-70'
                        : 'bg-blue-50/30 border-blue-50 hover:border-blue-200',
                    )}
                  >
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => handleToggleDone(m)}
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 transition-colors',
                        isDone
                          ? 'border-slate-300 bg-slate-200'
                          : 'border-blue-400 bg-white',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-medium leading-relaxed break-all',
                          isDone
                            ? 'text-slate-400 line-through decoration-slate-300'
                            : 'text-slate-700',
                        )}
                      >
                        {m.memo}
                      </p>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        {m.schedule && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                            <span className="w-1 h-1 rounded-full bg-orange-400" />
                            {m.schedule.value}
                            {m.schedule.type === 'absolute' ? '' : '분 뒤'}
                          </div>
                        )}
                        {isDone && m.done_timestamp && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-blue-500">
                            <span className="w-1 h-1 rounded-full bg-blue-400" />
                            {new Date(m.done_timestamp).toLocaleTimeString(
                              'ko-KR',
                              { hour: '2-digit', minute: '2-digit', hour12: false },
                            )}{' '}
                            완료
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

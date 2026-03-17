'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { MsMemoTx } from "@/types/monitoring/monitoring-type"
import MsMonitorMemoItem from "./ms-monitor-memo-item"

type Props = {
  memoTx: MsMemoTx
  startTime: string | null
}

export default function MsMonitorMemoList({ memoTx, startTime }: Props) {
  const sortedMemos = [...(memoTx || [])].sort((a, b) => {
    // 1. is_done이 false인 메모를 위로
    if (a.is_done !== b.is_done) {
      return a.is_done ? 1 : -1
    }

    // 2. is_done이 true인 경우 done_timestamp 역순
    if (a.is_done && b.is_done) {
      return new Date(b.done_timestamp || 0).getTime() - new Date(a.done_timestamp || 0).getTime()
    }

    // 3. 둘 다 is_done이 false인 경우 create_timestamp 역순 (최신순)
    return new Date(b.create_timestamp).getTime() - new Date(a.create_timestamp).getTime()
  })

  return (
    <div className="flex flex-col overflow-hidden bg-background">
      <div className="px-6 py-3 bg-muted/20 border-b flex items-center">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          처치 및 메모 ({memoTx?.length || 0})
        </h4>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {sortedMemos.length > 0 ? (
            sortedMemos.map((memo, idx) => (
              <MsMonitorMemoItem key={memo.id || idx} memo={memo} startTime={startTime} />
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground italic">
              등록된 메모가 없습니다
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

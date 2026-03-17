'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { MsMemoTx } from "@/types/monitoring/monitoring-type"
import MsMonitorMemoItem from "./ms-monitor-memo-item"

type Props = {
  memoTx: MsMemoTx
}

export default function MsMonitorMemoList({ memoTx }: Props) {
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
          {memoTx && memoTx.length > 0 ? (
            memoTx.map((memo, idx) => (
              <MsMonitorMemoItem key={memo.id || idx} memo={memo} />
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

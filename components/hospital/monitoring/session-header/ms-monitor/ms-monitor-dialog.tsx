'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from "react"
import { Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculateAgeKo } from "@/lib/utils/utils"
import MsMonitorTimeInfo from "./ms-monitor-time-info"
import MsMonitorVitalTable from "./ms-monitor-vital-table"
import MsMonitorMemoList from "./ms-monitor-memo-list"

type Props = {
  msData: MsWithPatientWithWeight
}

export default function MsMonitorDialog({ msData }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="모니터링 대시보드">
          <Monitor className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-none w-screen h-screen m-0 rounded-none flex flex-col p-0 gap-0 border-none">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-bold">
              모니터링 대시보드 - {msData.patient? msData.patient.name:"미등록 환자"}
              {msData.patient && "(" + msData.patient?.breed + " " + msData.patient?.gender + " " + calculateAgeKo(msData.patient?.birth) + " " + msData.patient?.body_weight + "kg)"}
            </DialogTitle>
          </div>
          {/* <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>닫기</Button> */}
        </div>

        {/* 메인 컨텐츠 (4분할) */}
        <div className="flex-1 grid grid-cols-2 overflow-hidden">
          
          {/* 왼쪽 컬럼 (상하 2분할) */}
          <div className="grid grid-rows-2 border-r overflow-hidden">
            <MsMonitorTimeInfo startTime={msData.start_time} endTime={msData.end_time} />
            <MsMonitorVitalTable vitalResults={msData.vital_results} plannedVitals={msData.planned_vitals} />
          </div>

          {/* 오른쪽 컬럼 (전체 높이): Memo Tx */}
          <MsMonitorMemoList memoTx={msData.memo_tx} startTime={msData.start_time} />

        </div>
      </DialogContent>
    </Dialog>
  )
}
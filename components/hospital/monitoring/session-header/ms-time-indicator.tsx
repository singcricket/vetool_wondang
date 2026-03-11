'use client'

import { Button } from '@/components/ui/button'
import { useMsTimer } from '@/hooks/use-ms-timer'
import { StopIcon } from '@radix-ui/react-icons'
import { PlayIcon } from 'lucide-react'
import { startMsTime, stopMsTime } from '@/lib/services/monitoring/update-ms'
import EditMsTimeDialog from '@/components/hospital/monitoring/session-header/edit-ms-time-dialog'

type Props = {
  startTime: string | null
  endTime: string | null
  sessionId: string
}



export default function MsTimeIndicator({
  endTime,
  startTime,
  sessionId,
}: Props) {
  const { formatted } = useMsTimer(startTime, endTime)
  
  const hasStarted = startTime !== null
  const hasEnded = endTime !== null

  const hasStartedAndNotEnded = hasStarted && !hasEnded
  const hasStartedAndEnded = hasStarted && hasEnded
  const hasNotStarted = !hasStarted

  return (
    <div className="flex items-center 2xl:absolute 2xl:left-2">
      {hasNotStarted && (
        <Button
          size="icon"
          variant="outline"
          onClick={() => startMsTime(sessionId)}
        >
          <PlayIcon />
        </Button>
      )}

      {hasStartedAndNotEnded && (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="outline"
            size="icon"
            onClick={() => stopMsTime(sessionId)}
          >
            <StopIcon />
          </Button>
          <EditMsTimeDialog
            startTime={startTime}
            endTime={endTime}
            sessionId={sessionId}
          />
          <div className="flex items-center gap-3">
            <p className="text-xl font-semibold tracking-tight">시작: {new Date(startTime).toTimeString().slice(0, 8)}</p>
            <div className="flex flex-col border-l pl-3">
              <p className="text-[10px] leading-none text-muted-foreground">경과 시간</p>
              <p className="text-sm font-bold text-primary">{formatted}</p>
            </div>
          </div>
        </div>
      )}

      {hasStartedAndEnded && (
        <div className="flex items-center gap-2 text-sm">
          <EditMsTimeDialog
            startTime={startTime}
            endTime={endTime}
            sessionId={sessionId}
          />
           <div className="flex items-center gap-3">
            <p className="text-l font-semibold tracking-tight text-muted-foreground">
              {new Date(startTime).toTimeString().slice(0, 8)} ~ {new Date(endTime).toTimeString().slice(0, 8)}
            </p>
            <div className="flex flex-col border-l pl-3">
              <p className="text-[10px] leading-none text-muted-foreground whitespace-nowrap">총 소요 시간</p>
              <p className="text-sm font-bold text-muted-foreground">{formatted}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

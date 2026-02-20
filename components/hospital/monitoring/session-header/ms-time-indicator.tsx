'use client'

import { Button } from '@/components/ui/button'

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
  const hasStarted = startTime !== null
  const hasEnded = endTime !== null

  const hasStartedAndNotEnded = hasStarted && !hasEnded
  const hasStartedAndEnded = hasStarted && hasEnded
  const hasNotStarted = !hasStarted

  return (
    <div className="absolute left-2 flex items-center">
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
          <p className="text-muted-foreground">
            시작 : {new Date(startTime).toTimeString().slice(0, 8)}
          </p>
           
        </div>
      )}

      {hasStartedAndEnded && (
        <div className="flex items-center gap-2 text-sm">
          <EditMsTimeDialog
            startTime={startTime}
            endTime={endTime}
            sessionId={sessionId}
          />
          <p className="text-muted-foreground">
            시작 : {new Date(startTime).toTimeString().slice(0, 8)} / 종료 :{' '}
            {new Date(endTime).toTimeString().slice(0, 8)}
          </p>
        </div>
      )}
    </div>
  )
}

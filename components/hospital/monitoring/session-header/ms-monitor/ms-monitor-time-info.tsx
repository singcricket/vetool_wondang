'use client'

import { Clock, PlayCircle, Timer } from "lucide-react"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useMsTimer } from "@/hooks/use-ms-timer"

type Props = {
  startTime: string | null
  endTime: string | null
}

export default function MsMonitorTimeInfo({ startTime, endTime }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { hours, mins } = useMsTimer(startTime, endTime)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 flex flex-col justify-center gap-6 bg-background">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">현재 시각</p>
          <p className="text-8xl font-black tabular-nums tracking-tighter">{format(currentTime, 'HH:mm:ss')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="flex items-center gap-3 border-r pr-4">
          <PlayCircle className="h-6 w-6 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">시작 시간</p>
            <p className="text-4xl font-bold tabular-nums">
              {startTime ? format(new Date(startTime), 'HH:mm') : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r pr-4">
          <PlayCircle className="h-6 w-6 text-rose-500 rotate-180" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">종료 시간</p>
            <p className="text-4xl font-bold tabular-nums">
              {endTime ? format(new Date(endTime), 'HH:mm') : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer className="h-6 w-6 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">경과 시간</p>
            <p className="text-4xl font-bold tabular-nums text-orange-600">
              {startTime ? `${hours}시 ${mins}분` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

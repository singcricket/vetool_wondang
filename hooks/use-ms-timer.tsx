// lib/hooks/monitoring/use-ms-timer.ts

import { useEffect, useState } from 'react'

export const useMsTimer = (startTime: string | null, endTime: string | null) => {
  const [minutesDiff, setMinutesDiff] = useState<number>(0)

  useEffect(() => {
    if (!startTime) {
      setMinutesDiff(0)
      return
    }

    const start = new Date(startTime).getTime()

    const calculateDiff = () => {
      const end = endTime ? new Date(endTime).getTime() : new Date().getTime()
      const diff = Math.max(0, end - start)
      const currentMinutes = Math.floor(diff / (1000 * 60))
      
      setMinutesDiff((prev) => (prev !== currentMinutes ? currentMinutes : prev))
    }

    calculateDiff()

    if (!endTime) {
      const timer = setInterval(calculateDiff, 1000)
      return () => clearInterval(timer)
    }
  }, [startTime, endTime])

  const hours = Math.floor(minutesDiff / 60)
  const mins = minutesDiff % 60

  return {
    minutesDiff,
    hours,
    mins,
    formatted: `${hours > 0 ? `${hours}시간 ` : ''}${mins}분`,
  }
}
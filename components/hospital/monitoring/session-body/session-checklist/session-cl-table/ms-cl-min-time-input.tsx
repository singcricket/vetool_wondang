'use client'

import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

type Props = {
  startTime: string | null
  intervalSetting: number | null
  value: string
  onChange: (val: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export default function MsClMinTimeInput({
  startTime,
  intervalSetting,
  value,
  onChange,
  onKeyDown,
  disabled
}: Props) {
  useEffect(() => {
    if (!startTime) return

    const calculateElapsed = () => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      const actualDiffMinutes = Math.floor((now - start) / (1000 * 60))
      
      let displayMinutes = actualDiffMinutes

      // intervalSetting이 1 이상일 경우 배수 단위로 내림 처리
      if (intervalSetting && intervalSetting >= 1) {
        displayMinutes = Math.floor(actualDiffMinutes / intervalSetting) * intervalSetting
      }

      // 0분 미만이거나 아직 도달하지 않았을 경우 처리 (선택)
      const finalValue = displayMinutes < 0 ? "0" : displayMinutes.toString()
      
      onChange(finalValue)
    }

    // 마운트 시 또는 startTime 변경 시 즉시 계산
    if (value === '') {
      calculateElapsed()
    }

    // 1초마다 재계산하여 헤더 타이머와 동기화
    const timer = setInterval(calculateElapsed, 1000)

    return () => clearInterval(timer)
  }, [startTime, intervalSetting, onChange, value === ''])

  return (
    <Input
      className="h-11 rounded-none border-0 pr-11 ring-inset"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="분(min)"
      onKeyDown={onKeyDown}
      disabled={disabled}
    />
  )
}

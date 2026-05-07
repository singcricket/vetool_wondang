'use client'

import { Input } from "@/components/ui/input"
import { useEffect, useState, useRef } from "react"

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
  const [isFocused, setIsFocused] = useState(false)
  const valueRef = useRef(value)
  
  useEffect(() => {
    valueRef.current = value
  }, [value])

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

      const finalValue = displayMinutes < 0 ? "0" : displayMinutes.toString()
      
      // 값이 비어있고, 포커스 상태가 아닐 때만 자동 계산된 값을 넣어줌
      if (valueRef.current === '' && !isFocused) {
        onChange(finalValue)
      }
    }

    // 마운트 시 또는 startTime 변경 시 즉시 계산
    if (valueRef.current === '') {
      calculateElapsed()
    }

    // 1초마다 재계산하여 타이머 동기화 (불필요한 빈번한 업데이트 방지)
    const timer = setInterval(calculateElapsed, 1000)

    return () => clearInterval(timer)
  }, [startTime, intervalSetting, onChange])

  return (
    <Input
      className="h-11 rounded-none border-0 pr-11 ring-inset"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder="분(min)"
      onKeyDown={onKeyDown}
      disabled={disabled}
    />
  )
}

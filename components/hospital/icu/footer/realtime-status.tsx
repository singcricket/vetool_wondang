'use client'

import { useZustandIcuRealtimeStore } from '@/lib/store/icu/realtime-state'
import { cn } from '@/lib/utils/utils'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'realtime-reload'
const MAX_RELOAD_COUNT = 3
const RELOAD_COOLDOWN_MS = 60_000 // 마지막 reload로부터 1분 경과 시 카운터 리셋
const RELOAD_TIMEOUT_MS = 10_000 // 3초에서 10초로 연장

type ReloadState = {
  count: number
  lastReloadTime: number
}

function getReloadState(): ReloadState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, lastReloadTime: 0 }
    return JSON.parse(raw) as ReloadState
  } catch {
    return { count: 0, lastReloadTime: 0 }
  }
}

function incrementReloadCount() {
  const state = getReloadState()
  const now = Date.now()

  // 마지막 reload로부터 1분 이상 경과했으면 카운터 리셋
  const count =
    now - state.lastReloadTime > RELOAD_COOLDOWN_MS ? 1 : state.count + 1

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count, lastReloadTime: now }),
  )
  return count
}

function resetReloadCount() {
  sessionStorage.removeItem(STORAGE_KEY)
}

function canAutoReload(): boolean {
  const state = getReloadState()
  const now = Date.now()

  // 마지막 reload로부터 1분 이상 경과했으면 항상 허용
  if (now - state.lastReloadTime > RELOAD_COOLDOWN_MS) return true

  return state.count < MAX_RELOAD_COUNT
}

export default function RealtimeStatus() {
  const [mounted, setMounted] = useState(false)
  const isRealtimeReady = useZustandIcuRealtimeStore(
    (state) => state.isRealtimeReadyZustand,
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Realtime 연결 성공 시 reload 카운터 리셋
  useEffect(() => {
    if (isRealtimeReady) {
      resetReloadCount()
    }
  }, [isRealtimeReady])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let toastId: string | number | undefined

    const checkRealtimeStatus = () => {
      if (!isRealtimeReady && document.visibilityState === 'visible') {
        timeoutId = setTimeout(() => {
          if (canAutoReload()) {
            // 자동 새로고침
            incrementReloadCount()
            window.location.reload()
          } else {
            // 연속 실패 시 toast로 폴백
            toastId = toast.info(
              '실시간 연결이 끊어졌습니다. 새로고침을 시도해주세요',
              {
                duration: Infinity,
                action: {
                  label: '새로고침',
                  onClick: () => {
                    resetReloadCount()
                    window.location.reload()
                  },
                },
              },
            )
          }
        }, RELOAD_TIMEOUT_MS)
      } else {
        clearTimeout(timeoutId)
        if (toastId !== undefined) {
          toast.dismiss(toastId)
        }
      }
    }

    // 1. isRealtimeReady 상태 변경 시 체크
    checkRealtimeStatus()

    // 2. 탭 가시성 변경 시 체크 (숨김 -> 활성 전환 시)
    const handleVisibilityChange = () => {
      checkRealtimeStatus()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(timeoutId)
      if (toastId !== undefined) {
        toast.dismiss(toastId)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRealtimeReady])

  if (!mounted) {
    return (
      <div className="mr-2 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs text-muted-foreground">실시간</span>
      </div>
    )
  }

  return (
    <div className="mr-2 flex items-center gap-2">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          isRealtimeReady ? 'animate-pulse bg-green-500' : 'bg-red-500',
        )}
      />
      <span className="text-xs text-muted-foreground">실시간</span>
    </div>
  )
}


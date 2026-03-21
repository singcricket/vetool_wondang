'use client'

import { useZustandMonitoringRealtimeStore } from '@/lib/store/monitoring/monitoring-realtime-state'
import { cn } from '@/lib/utils/utils'
import { useEffect } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'monitoring-realtime-reload'
const MAX_RELOAD_COUNT = 3
const RELOAD_COOLDOWN_MS = 60_000

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

  if (now - state.lastReloadTime > RELOAD_COOLDOWN_MS) return true

  return state.count < MAX_RELOAD_COUNT
}

export default function MonitoringRealtimeStatus() {
  const isRealtimeReady = useZustandMonitoringRealtimeStore(
    (state) => state.isRealtimeReadyZustand,
  )

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
            incrementReloadCount()
            window.location.reload()
          } else {
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
        }, 3000)
      } else {
        clearTimeout(timeoutId)
        if (toastId !== undefined) {
          toast.dismiss(toastId)
        }
      }
    }

    checkRealtimeStatus()

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

  return (
    <div className="flex items-center gap-2">
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


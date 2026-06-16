import { useZustandMonitoringRealtimeStore } from '@/lib/store/monitoring/monitoring-realtime-state'
import { createClient } from '@/lib/supabase/client'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'

const RECONNECT_DELAY_MS = 5000

export function useMonitoringRealtime(hosId: string) {
  const { isRealtimeReadyZustand, setIsRealtimeReadyZustand } = useZustandMonitoringRealtimeStore()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { refresh } = useRouter()

  const debouncedRefresh = useDebouncedCallback(() => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
    }

    startTransition(() => {
        refresh()
    })
  }, 1000)

  const handleChange = useCallback(
    (payload: unknown) => {
      const p = payload as { table?: string; eventType?: string } | null
      if (!p?.table || !p?.eventType) return
      debouncedRefresh()
    },
    [debouncedRefresh],
  )

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    clearReconnectTimer()
    if (subscriptionRef.current) {
      await supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      setIsRealtimeReadyZustand(false)
    }
  }, [clearReconnectTimer, setIsRealtimeReadyZustand, supabase])

  const subscribeToChannel = useCallback(() => {
    if (subscriptionRef.current) return

    const channel = supabase.channel(`monitoring_realtime_${hosId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'monitoring_sessions',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'monitoring_sessions',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'monitoring_sessions' },
        handleChange,
      )

    subscriptionRef.current = channel.subscribe((status, err) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        setIsRealtimeReadyZustand(true)
      } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
        setIsRealtimeReadyZustand(false)
      } else if (
        status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
        status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
      ) {
        setIsRealtimeReadyZustand(false)
        if (err) console.warn(`[monitoring-realtime] ${status}:`, err.message)

        // 기존 채널 정리 후 재연결
        clearReconnectTimer()
        reconnectTimerRef.current = setTimeout(async () => {
          if (subscriptionRef.current) {
            await supabase.removeChannel(subscriptionRef.current)
            subscriptionRef.current = null
          }
          subscribeToChannel()
        }, RECONNECT_DELAY_MS)
      }
    })
  }, [hosId, handleChange, setIsRealtimeReadyZustand, supabase, clearReconnectTimer])

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      unsubscribe()
    } else {
      subscribeToChannel()
    }
  }, [subscribeToChannel, unsubscribe])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    subscribeToChannel()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribe()
    }
  }, [handleVisibilityChange, subscribeToChannel, unsubscribe])

  return isRealtimeReadyZustand
}

import { useZustandIcuRealtimeStore } from '@/lib/store/icu/realtime-state'
import { createClient } from '@/lib/supabase/client'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

const RECONNECT_DELAY_MS = 5000

export default function useIcuRealtime(hosId: string) {
  const { setIsRealtimeReadyZustand } = useZustandIcuRealtimeStore()

  const supabase = createClient()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { refresh } = useRouter()

  const debouncedRefresh = useDebouncedCallback(() => {
    refresh()
  }, 500)

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

  const unsubscribe = useCallback(() => {
    clearReconnectTimer()
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      setIsRealtimeReadyZustand(false)
    }
  }, [clearReconnectTimer, setIsRealtimeReadyZustand, supabase])

  const subscribeToChannel = useCallback(() => {
    if (subscriptionRef.current) return

    const channel = supabase.channel(`icu_realtime_${hosId}`)

    TABLES.forEach((table) => {
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
            filter: `hos_id=eq.${hosId}`,
          },
          handleChange,
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter: `hos_id=eq.${hosId}`,
          },
          handleChange,
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table },
          handleChange,
        )
    })

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
        if (err) console.warn(`[icu-realtime] ${status}:`, err.message)

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
  }, [handleChange, hosId, setIsRealtimeReadyZustand, supabase, clearReconnectTimer])

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      unsubscribe()
    } else {
      subscribeToChannel()
      refresh()
    }
  }, [refresh, subscribeToChannel, unsubscribe])

  useEffect(() => {
    subscribeToChannel()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange, subscribeToChannel, unsubscribe])
}

function getLogColor(table: string): string {
  switch (table) {
    case 'icu_io':
      return 'blue'
    case 'icu_charts':
      return 'red'
    case 'icu_orders':
      return 'green'
    case 'icu_txs':
      return 'purple'
    default:
      return 'gray'
  }
}

const TABLES = ['icu_io', 'icu_charts', 'icu_orders', 'icu_txs'] as const

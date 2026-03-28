import { useZustandEchoRealtimeStore } from '@/lib/store/echocardio/echo-realtime-state'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export function useEchoRealtime(hosId: string) {
  const { isRealtimeReadyZustand, setIsRealtimeReadyZustand } = useZustandEchoRealtimeStore()
  const [, startTransition] = useTransition()
  const supabase = createClient()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
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
    (payload: any) => {
      if (!payload?.table || !payload?.eventType) return
      debouncedRefresh()
    },
    [debouncedRefresh],
  )

  const subscribeToChannel = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('Echo subscription already exists. Skipping...')
      return
    }

    console.log('Creating new echo subscription...')
    const channel = supabase.channel(`echo_realtime_${hosId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'echo_charts',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'echo_charts',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'echo_charts' },
        handleChange,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'echo_results' },
        handleChange,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'echo_results' },
        handleChange,
      )

    subscriptionRef.current = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to echo_charts')
        setIsRealtimeReadyZustand(true)
      } else {
        console.log('Echo subscription failed with status:', status)
        setIsRealtimeReadyZustand(false)
      }
    })
  }, [hosId, handleChange, setIsRealtimeReadyZustand, supabase])

  const unsubscribe = useCallback(async () => {
    if (subscriptionRef.current) {
      console.log('Unsubscribing from echo channel...')
      await supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
      setIsRealtimeReadyZustand(false)
    }
  }, [setIsRealtimeReadyZustand, supabase])

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      console.log('Page is hidden, unsubscribing from echo...')
      unsubscribe()
    } else {
      console.log('Page is visible, resubscribing to echo...')
      subscribeToChannel()
    }
  }, [subscribeToChannel, unsubscribe])

  useEffect(() => {
    console.log('echo initial subscription')
    document.addEventListener('visibilitychange', handleVisibilityChange)
    subscribeToChannel()

    return () => {
      console.log('Echo cleanup: unsubscribing and removing event listener...')
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribe()
    }
  }, [handleVisibilityChange, subscribeToChannel, unsubscribe])

  return isRealtimeReadyZustand
}

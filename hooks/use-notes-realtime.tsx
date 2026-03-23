'use client'

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

/**
 * notes 테이블의 실시간 변경사항을 감지하여 UI를 갱신하는 훅
 */
export default function useNotesRealtime(hosId: string) {
  const supabase = createClient()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const { refresh } = useRouter()

  // 잦은 변경으로 인한 과도한 새로고침을 방지하기 위해 데바운스 적용
  const debouncedRefresh = useDebouncedCallback(() => {
    console.log('Debounced refresh for notes')
    refresh()
  }, 500)

  const handleChange = useCallback(
    (payload: any) => {
      if (!payload?.table || !payload?.eventType) return
      
      debouncedRefresh()
      
      console.log(
        `%c${payload.table} ${payload.eventType}`,
        `background: #2563eb; color:white; padding: 2px 5px; border-radius: 3px;`,
      )
    },
    [debouncedRefresh],
  )

  const subscribeToChannel = useCallback(() => {
    if (subscriptionRef.current) {
      return
    }

    const channel = supabase.channel(`notes_realtime_${hosId}`)
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 전체 감지
          schema: 'public',
          table: 'notes',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )

    subscriptionRef.current = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to notes realtime updates')
      }
    })
  }, [handleChange, hosId, supabase])

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
    }
  }, [supabase])

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

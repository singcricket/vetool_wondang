'use client'

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

/**
 * notes 테이블의 실시간 변경사항을 감지하여 UI를 갱신하는 훅
 */
export default function useNotesRealtime(hosId: string) {
  const supabase = createClient()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const { refresh } = useRouter()
  const pathname = usePathname()

  // 잦은 변경으로 인한 과도한 새로고침을 방지하기 위해 데바운스 적용
  const debouncedRefresh = useDebouncedCallback(() => {
    // 사용자가 새 문서를 작성 중이거나 수정 중인 페이지(/new, /edit)에 있을 경우 중단
    const isEditingOnPage = pathname.includes('/new') || pathname.includes('/edit')
    
    // 다이얼로그가 열려있더라도, 내부에서 입력 작업(input, textarea) 중인 경우에만 중단
    // 단순 열람 중인 다이얼로그는 실시간 업데이트를 허용함
    const isWorkingInDialog = !!document.querySelector('[role="dialog"] input, [role="dialog"] textarea, [role="dialog"] [contenteditable="true"]')
    
    if (isEditingOnPage || isWorkingInDialog) {
      console.log('Skipping event: user is currently editing or typing')
      return
    }

    console.log('Dispatching notes-updated event')
    // 클라이언트 컴포넌트들에게 변경 알림을 보내어 부분 렌더링 유도
    window.dispatchEvent(new CustomEvent('notes-updated'))
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
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `hos_id=eq.${hosId}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notes',
        },
        handleChange,
      )

    subscriptionRef.current = channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to notes realtime updates for hos_id:', hosId)
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error for notes realtime:', err)
      }
      if (status === 'TIMED_OUT') {
        console.warn('🕒 Subscription timed out for notes realtime')
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

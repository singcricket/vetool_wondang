'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Options {
  checkupId: string
  /** 저장 중일 때 true — 자기 자신이 트리거한 realtime 이벤트를 무시하기 위해 사용 */
  isSaving: React.MutableRefObject<boolean>
  /** section_type과 새 data를 받아 해당 탭을 업데이트하는 콜백 */
  onSectionUpdate: (sectionType: string, data: Record<string, unknown>) => void
}

export function useCheckupCaseRealtime({ checkupId, isSaving, onSectionUpdate }: Options) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const cbRef = useRef(onSectionUpdate)
  cbRef.current = onSectionUpdate

  useEffect(() => {
    if (channelRef.current) return

    const channel = supabase
      .channel(`checkup_case_${checkupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkup_sections',
          filter: `checkup_id=eq.${checkupId}`,
        },
        (payload) => {
          // 내가 저장한 직후의 이벤트는 무시 (자기 트리거 방지)
          if (isSaving.current) return
          const row = payload.new as { section_type?: string; data?: Record<string, unknown> }
          if (!row?.section_type) return
          cbRef.current(row.section_type, row.data ?? {})
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkupId])
}

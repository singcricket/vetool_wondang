'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useDebouncedCallback } from 'use-debounce'
import { refreshCheckupReportData } from '@/lib/actions/checkup/report-refresh-actions'
import type { CheckupReportSection, CheckupReportImage } from '@/lib/services/checkup/fetch-checkup-report'

interface UseCheckupReportRealtimeOptions {
  checkupId: string
  onUpdate: (sections: CheckupReportSection[], images: CheckupReportImage[]) => void
}

export function useCheckupReportRealtime({ checkupId, onUpdate }: UseCheckupReportRealtimeOptions) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const fetchAndUpdate = useDebouncedCallback(async () => {
    try {
      const { sections, images } = await refreshCheckupReportData(checkupId)
      onUpdateRef.current(sections, images)
    } catch (e) {
      console.error('[CheckupRealtime] 데이터 갱신 실패:', e)
    }
  }, 800)

  const subscribe = useCallback(() => {
    if (channelRef.current) return

    const channel = supabase
      .channel(`checkup_report_${checkupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkup_sections',
          filter: `checkup_id=eq.${checkupId}`,
        },
        () => fetchAndUpdate(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkup_images',
          filter: `checkup_id=eq.${checkupId}`,
        },
        () => fetchAndUpdate(),
      )
      .subscribe()

    channelRef.current = channel
  }, [checkupId, fetchAndUpdate, supabase])

  useEffect(() => {
    subscribe()
    return () => {
      fetchAndUpdate.cancel()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [checkupId])
}

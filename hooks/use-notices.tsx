import { getNotices } from '@/lib/services/hospital-home/notice'
import { NoticeWithUser } from '@/types/hospital/notice'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const useNotices = (hosId: string) => {
  const [isFetching, setIsFetching] = useState(true)
  const [notices, setNotices] = useState<NoticeWithUser[]>([])

  const fetchNotices = useCallback(async () => {
    setIsFetching(true)
    try {
      const noticesData = await getNotices(hosId)
      setNotices(noticesData)
    } catch (error) {
      console.error('Failed to fetch notices:', error)
    } finally {
      setIsFetching(false)
    }
  }, [hosId])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  // 리얼타임 구독
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notices_realtime_${hosId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notices',
          filter: `hos_id=eq.${hosId}`,
        },
        () => {
          // 데이터 변경 시 전체 다시 가져오기
          fetchNotices()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hosId, fetchNotices])

  return { notices, isFetching, refetch: fetchNotices }
}

'use client'

// 알림 기능 비활성화 — 다시 켜려면 아래 주석 해제 후 이 줄 삭제
export function MonitoringNotificationProvider({
  hosId: _hosId,
  children,
}: {
  hosId: string
  children: React.ReactNode
}) {
  return <>{children}</>
}

/* ── 비활성화된 원본 코드 ──────────────────────────────────────
import { useLocalNotification } from '@/hooks/use-local-notification'
import { createClient } from '@/lib/supabase/client'
import { MsMemo } from '@/types/monitoring/monitoring-type'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export function MonitoringNotificationProvider_DISABLED({
  hosId,
  children,
}: {
  hosId: string
  children: React.ReactNode
}) {
  const [sessions, setSessions] = useState<any[]>([])
  const notifiedMemosRef = useRef<Set<string>>(new Set())
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()
  
  const { requestPermission, sendNotification } = useLocalNotification()

  // 1. 초기 데이터 로드 (현재 활성화된 세션들)
  useEffect(() => {
    const fetchActiveSessions = async () => {
      const { data } = await supabase
        .from('monitoring_sessions')
        .select('*')
        .eq('hos_id', hosId)
        .is('end_time', null)

      if (data) setSessions(data)
    }

    fetchActiveSessions()
  }, [hosId, supabase])

  // 2. 실시간 동기화
  useEffect(() => {
    if (subscriptionRef.current) return

    const channel = supabase.channel(`monitoring_notif_${hosId}`)
    
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monitoring_sessions', filter: `hos_id=eq.${hosId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (!payload.new.end_time) {
              setSessions((prev) => [...prev, payload.new])
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.end_time) {
              // 세션 종료시 제거
              setSessions((prev) => prev.filter((s) => s.session_id !== payload.new.session_id))
            } else {
              setSessions((prev) => 
                prev.map((s) => s.session_id === payload.new.session_id ? payload.new : s)
              )
            }
          } else if (payload.eventType === 'DELETE') {
            // 삭제 시 연관된 알림 기록도 제거 (선택적)
            setSessions((prev) => prev.filter((s) => s.session_id !== payload.old.session_id))
          }
        }
      )

    subscriptionRef.current = channel.subscribe()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [hosId, supabase])

  // 3. 권한 로드
  useEffect(() => {
    // 앱 진입 시 한 번 권한 요청 프로세스 밟기 (사용자 인터랙션 없이도 묻기는 함)
    // 최신 브라우저 정책상 사용자 제스처 없이 막힐 수 있으나, 일단 시도
    requestPermission()
  }, []) // eslint-disable-next-line react-hooks/exhaustive-deps

  // 4. 스케줄러 (매 10초마다 검사)
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date().getTime()
      
      sessions.forEach((session) => {
        const memos: MsMemo[] = session.memo_tx || []
        
        memos.forEach((memo) => {
          if (!memo.schedule || memo.is_done) return // 미완료된 예약 메모만 대상
          if (notifiedMemosRef.current.has(memo.id)) return // 이미 알림 보낸 메모는 패스

          let targetTimeMs: number | null = null

          if (memo.schedule.type === 'absolute') {
            // value is "HH:MM" e.g., "16:30"
            const [hours, minutes] = String(memo.schedule.value).split(':').map(Number)
            const d = new Date()
            d.setHours(hours, minutes, 0, 0)
            targetTimeMs = d.getTime()
            
            // 만약 현재가 자정 무렵이고 설정 시간이 어제/오늘 모호하다면 추가 로직이 필요할 수 있으나 기본적으로 오늘 기준
          } else if (memo.schedule.type === 'after_start' && session.start_time) {
            targetTimeMs = new Date(session.start_time).getTime() + Number(memo.schedule.value) * 60000
          } else if (memo.schedule.type === 'after_prev' && memo.schedule.target_memo_id) {
            const targetMemo = memos.find(m => m.id === memo.schedule?.target_memo_id)
            if (targetMemo?.done_timestamp) {
              targetTimeMs = new Date(targetMemo.done_timestamp).getTime() + Number(memo.schedule.value) * 60000
            }
          }

          if (targetTimeMs && now >= targetTimeMs) {
            // 알림 트리거!
            notifiedMemosRef.current.add(memo.id)
            
            const message = `[${session.session_title || '모니터링'}] 예정된 처치 시간입니다: ${memo.memo.slice(0, 20)}...`
            
            // 1) 토스트
            toast.info('처치 예정 시간 도달', { 
              description: message, 
              duration: Number.POSITIVE_INFINITY, // 수동으로 끌 때까지 무한 유지
              action: {
                label: '확인',
                onClick: () => console.log('알림 확인됨')
              }
            })
            
            // 2) 네이티브 푸시 알림
            sendNotification('처치 알림', { body: message })
            
            // 3) 소리 (웹 정책상 클릭 이후에만 재생 가능할 수 있음)
            try {
              // 임시 비프음 (Oscillator)
              const audioCtx = window.AudioContext ? new window.AudioContext() : null
              if (audioCtx && audioCtx.state !== 'suspended') {
                // 3번 울리는 삐-삐-삐 알림 패턴 (더 크고 뚜렷하게)
                for (let i = 0; i < 3; i++) {
                  const oscillator = audioCtx.createOscillator()
                  const gainNode = audioCtx.createGain()
                  
                  oscillator.type = 'sine'
                  oscillator.frequency.value = 880 // A5 소리
                  
                  // 기존 볼륨 0.1 -> 0.5로 상향
                  const startTime = audioCtx.currentTime + i * 0.4
                  const stopTime = startTime + 0.2 // 0.2초 재생 후 0.2초 간격
                  
                  gainNode.gain.setValueAtTime(0.8, startTime)
                  gainNode.gain.setValueAtTime(0, stopTime)
                  
                  oscillator.connect(gainNode)
                  gainNode.connect(audioCtx.destination)
                  
                  oscillator.start(startTime)
                  oscillator.stop(stopTime)
                }
              }
            } catch (e) {
              // ignore
            }
          }
        })
      })
    }

    const timer = setInterval(checkSchedules, 10000)
    return () => clearInterval(timer)
  }, [sessions, sendNotification])

  return <>{children}</>
}
── ──────────────────────────────────────────────────────── */

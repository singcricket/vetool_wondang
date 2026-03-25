'use client'

import { useEffect, useState } from 'react'

export function useLocalNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 데스크톱 알림을 지원하지 않습니다.')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    }

    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico', // 기본 아이콘 경로 필요 시 수정
          tag: 'vetool-monitoring-alert', // 중복 알림 방지 태그
          ...options
        })

        // 웹소리 비프음 트리거 (선택 사항)
        // const audio = new Audio('/assets/sounds/bell.mp3') // 실제 파일이 필요함
        // audio.play().catch(e => console.log('Audio play failed:', e))
        
        // 클릭 시 창 포커스
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (e) {
        console.error('Notification failed:', e)
      }
    } else if (Notification.permission !== 'denied') {
      // 권한이 없으면 다시 요청 시도
      requestPermission().then((granted) => {
        if (granted) {
          sendNotification(title, options)
        }
      })
    }
  }

  return { permission, requestPermission, sendNotification }
}

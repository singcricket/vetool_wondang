'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Props {
  isVet: boolean
  hosId: string
  targetDate: string
}

export function IcuRoleGuard({ isVet, hosId, targetDate }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // 수의사가 아닌 경우
    if (!isVet) {
      // tx-table을 포함하지 않는 경로로 접근 시 tx-table로 리다이렉트
      const isTxTable = pathname.includes('/tx-table')
      
      // ICU 모듈 내의 다른 경로인지 확인 (예: /hospital/id/icu/date/summary)
      const icuPathPrefix = `/hospital/${hosId}/icu/${targetDate}`
      const isInsideIcu = pathname.startsWith(icuPathPrefix)

      if (isInsideIcu && !isTxTable) {
        router.replace(`${icuPathPrefix}/tx-table` as any)
      }
    }
  }, [isVet, pathname, router, hosId, targetDate])

  return null
}

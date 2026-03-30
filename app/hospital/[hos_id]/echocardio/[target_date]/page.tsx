'use client'

import NoResultSquirrel from '@/components/common/no-result-squirrel'
import useIsMobile from '@/hooks/use-is-mobile'

export default function EchoDatePage() {
  const isMobile = useIsMobile()

  return (
     <NoResultSquirrel
         text={isMobile ? '👆 환자를 선택해주세요' : '👈 환자를 선택해주세요'}
         className="h-screen flex-col"
         size="lg"
       />
  )
}

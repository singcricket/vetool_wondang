'use client'

import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NoticeRefreshButton({
  onClick,
  isLoading,
}: {
  onClick?: () => void
  isLoading?: boolean
}) {
  const { refresh } = useRouter()

  const handleRefresh = () => {
    if (onClick) {
      onClick()
    } else {
      refresh()
    }
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleRefresh}
      disabled={isLoading}
    >
      <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
    </Button>
  )
}

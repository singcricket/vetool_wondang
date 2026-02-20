import { cn } from '@/lib/utils/utils'

type Props = {
  isSubscriptionReady: boolean
}

export default function MonitoringRealtimeStatus({
  isSubscriptionReady,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          isSubscriptionReady ? 'animate-pulse bg-green-500' : 'bg-red-500',
        )}
      />
      <span className="text-xs text-muted-foreground">실시간</span>
    </div>
  )
}

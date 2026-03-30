import { Skeleton } from '@/components/ui/skeleton'

export default function TodoSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1 h-[800px]">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-full w-full rounded-sm" />
      ))}
    </div>
  )
}

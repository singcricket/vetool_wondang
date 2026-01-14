import { cn } from '@/lib/utils/utils'
import { format } from 'date-fns'

type Props = {
  date: string | Date
  className?: string
  withTime?: boolean
}

export default function FormattedMonoDate({
  date,
  className,
  withTime,
}: Props) {
  return (
    <time
      dateTime={new Date(date).toISOString()}
      className={cn('pt-[1px] font-mono', className)}
      suppressHydrationWarning
    >
      {format(new Date(date), withTime ? 'yy.MM.dd HH:mm' : 'yy.MM.dd')}
    </time>
  )
}

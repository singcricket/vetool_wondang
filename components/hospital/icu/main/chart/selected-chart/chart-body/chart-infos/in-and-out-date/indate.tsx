import FormattedMonoDate from '@/components/common/formatted-mono-date'
import { LogInIcon } from 'lucide-react'

export default function Indate({ inDate }: { inDate: string }) {
  return (
    <div className="flex h-9 select-none items-center gap-2 rounded-md border p-2 shadow-sm">
      <LogInIcon className="text-muted-foreground" size={16} />
      <FormattedMonoDate date={inDate} className="text-sm" />
    </div>
  )
}

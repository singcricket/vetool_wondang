import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/utils'
import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode
  unit: string
  id: string
  wrapperClassName?: string
}

export default function UnitInput({
  label,
  unit,
  id,
  wrapperClassName,
  className,
  ...props
}: Props) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        type="number"
        id={id}
        autoComplete="off"
        className={cn('mt-1', className)}
        {...props}
      />
      <span className="absolute bottom-2 right-2 text-sm text-muted-foreground">
        {unit}
      </span>
    </div>
  )
}

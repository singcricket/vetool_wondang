import { AlertCircleIcon } from 'lucide-react'

type Props = {
  title?: string
  children: React.ReactNode
}

export default function CalculatorWarning({
  title = '주의사항',
  children,
}: Props) {
  return (
    <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
      <div className="flex items-center gap-1.5 font-medium">
        <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
        {title}
      </div>
      <ul className="ml-5 list-disc space-y-0.5">{children}</ul>
    </div>
  )
}

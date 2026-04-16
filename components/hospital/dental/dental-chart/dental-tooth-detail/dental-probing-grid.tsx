'use client'

import { Input } from '@/components/ui/input'

type SixPoint = {
  ml: number | null
  l: number | null
  dl: number | null
  mb: number | null
  b: number | null
  db: number | null
}

type Props = {
  label: string
  values: SixPoint
  onChange: (key: keyof SixPoint, value: number | null) => void
  disabled?: boolean
}

const BUCCAL_KEYS: (keyof SixPoint)[] = ['mb', 'b', 'db']
const LINGUAL_KEYS: (keyof SixPoint)[] = ['ml', 'l', 'dl']
const KEY_LABELS: Record<keyof SixPoint, string> = {
  mb: 'MB', b: 'B', db: 'DB',
  ml: 'ML', l: 'L', dl: 'DL',
}

export default function DentalProbingGrid({ label, values, onChange, disabled }: Props) {
  function handleChange(key: keyof SixPoint, raw: string) {
    const num = raw === '' ? null : Number(raw)
    onChange(key, num === null || isNaN(num) ? null : Math.min(20, Math.max(0, num)))
  }

  function renderRow(keys: (keyof SixPoint)[]) {
    return (
      <div className="flex gap-1">
        {keys.map((k) => (
          <div key={k} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">{KEY_LABELS[k]}</span>
            <Input
              type="number"
              min={0}
              max={20}
              value={values[k] ?? ''}
              onChange={(e) => handleChange(k, e.target.value)}
              disabled={disabled}
              className="h-7 w-12 text-center text-xs"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <div className="flex flex-col gap-1 rounded border bg-slate-50 p-2">
        {/* Lingual / Palatal 행 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] text-muted-foreground">L/Palatal</span>
          {renderRow(LINGUAL_KEYS)}
        </div>
        <div className="border-t" />
        {/* Buccal 행 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] text-muted-foreground">Buccal</span>
          {renderRow(BUCCAL_KEYS)}
        </div>
      </div>
    </div>
  )
}

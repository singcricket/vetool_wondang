'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    const num = raw === 'none' ? null : Number(raw)
    onChange(key, num)
  }

  function renderRow(keys: (keyof SixPoint)[]) {
    return (
      <div className="flex gap-1">
        {keys.map((k) => (
          <div key={k} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">{KEY_LABELS[k]}</span>
            <Select value={values[k]?.toString() ?? 'none'} onValueChange={(val) => handleChange(k, val)} disabled={disabled}>
              <SelectTrigger className="h-7 w-[52px] px-1 py-0 justify-center text-xs text-center [&>span]:text-center">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent className="min-w-[52px]">
                <SelectItem value="none" className="text-xs justify-center">-</SelectItem>
                {Array.from({ length: 11 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()} className="text-xs justify-center">{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

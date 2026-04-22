'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/utils'

type SixPointValue = string | number | null

type SixPoint = {
  ml: SixPointValue; l: SixPointValue; dl: SixPointValue;
  mb: SixPointValue; b: SixPointValue; db: SixPointValue;
}

type Props = {
  label: string
  values: SixPoint
  onChange: (key: keyof SixPoint, value: SixPointValue) => void
  disabled?: boolean
  type?: 'select' | 'input'
  options?: { value: string; label: string }[]
  species?: string
}

const BUCCAL_KEYS: (keyof SixPoint)[] = ['mb', 'b', 'db']
const LINGUAL_KEYS: (keyof SixPoint)[] = ['ml', 'l', 'dl']
const KEY_LABELS: Record<keyof SixPoint, string> = {
  mb: 'MB', b: 'B', db: 'DB',
  ml: 'ML', l: 'L', dl: 'DL',
}

export default function DentalProbingGrid({ 
  label, 
  values, 
  onChange, 
  disabled,
  type = 'select',
  options,
  species
}: Props) {
  function handleChange(key: keyof SixPoint, raw: string) {
    if (type === 'select') {
      // options가 제공된 경우 (예: 치은 퇴축) 텍스트 그대로 사용, 아니면 숫자로 변환 시도
      if (options) {
        onChange(key, raw === 'none' ? null : raw)
      } else {
        const num = raw === 'none' ? null : Number(raw)
        onChange(key, num)
      }
    } else {
      // type === 'input' (예: 치주낭 깊이)
      if (raw === '') {
        onChange(key, null)
        return
      }
      const num = parseFloat(raw)
      if (!isNaN(num) && num >= 0) {
        onChange(key, num)
      }
    }
  }

  function renderRow(keys: (keyof SixPoint)[]) {
    return (
      <div className="flex gap-1">
        {keys.map((k) => (
          <div key={k} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">{KEY_LABELS[k]}</span>
            {type === 'select' ? (
              <Select value={values[k]?.toString() ?? 'none'} onValueChange={(val) => handleChange(k, val)} disabled={disabled}>
                <SelectTrigger className="h-7 min-w-[72px] px-1 py-0 justify-center text-[10px] text-center [&>span]:text-center">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent className="min-w-[72px]">
                  <SelectItem value="none" className="text-[10px] justify-center">-</SelectItem>
                  {options ? (
                    options.filter(o => o.value !== 'none').map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-[10px] justify-center">{o.label}</SelectItem>
                    ))
                  ) : (
                    Array.from({ length: 11 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()} className="text-[10px] justify-center">{i}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                step="any"
                min="0"
                disabled={disabled}
                value={values[k]?.toString() ?? ''}
                onChange={(e) => handleChange(k, e.target.value)}
                className="h-7 w-[52px] px-1 py-0 text-center text-xs focus-visible:ring-1"
                placeholder="-"
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const isFeline = species?.toLowerCase().startsWith('fel')
  const referenceValue = type === 'input' ? (isFeline ? '< 1mm' : '< 3mm') : null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {referenceValue && (
          <span className="text-[10px] text-muted-foreground bg-slate-200/50 px-1.5 py-0.5 rounded-full">
            참고치 (정상): {referenceValue}
          </span>
        )}
      </div>
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

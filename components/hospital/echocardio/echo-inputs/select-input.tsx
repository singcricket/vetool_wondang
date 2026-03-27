'use client'

import type { SelectTest } from '@/types/echocardio/echocardio-type'

interface SelectInputProps {
  item: SelectTest
  value: string
  onChange: (keywordId: string, value: string) => void
  resultLabel?: string
  commentLabel?: string
}

export default function SelectInput({
  item,
  value,
  onChange,
  resultLabel,
  commentLabel,
}: SelectInputProps) {
  const isAbnormal = resultLabel && resultLabel !== 'normal' && resultLabel !== ''

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(item.keywordID, e.target.value)}
        className="w-40 rounded border px-1.5 py-1 text-xs"
      >
        {item.options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt || '—'}
          </option>
        ))}
      </select>

      {resultLabel && (
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            isAbnormal
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {resultLabel}
        </span>
      )}

      {commentLabel && isAbnormal && (
        <span className="text-[10px] text-muted-foreground">{commentLabel}</span>
      )}
    </div>
  )
}

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
        className="w-44 rounded border px-1.5 py-1 text-sm outline-none focus:ring-1 focus:ring-black/5"
      >
        {item.options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt || '—'}
          </option>
        ))}
      </select>

      {resultLabel && (
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            isAbnormal
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {resultLabel}
        </span>
      )}

      {commentLabel && isAbnormal && (
        <span className="text-xs text-muted-foreground">{commentLabel}</span>
      )}
    </div>
  )
}

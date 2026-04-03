'use client'

interface RangeInputProps {
  keywordId: string
  unit?: string
  value: string
  onChange: (keywordId: string, value: string) => void
  resultLabel?: string
  commentLabel?: string
  refMin?: number
  refMax?: number
}

export default function RangeInput({
  keywordId,
  unit,
  value,
  onChange,
  resultLabel,
  commentLabel,
  refMin,
  refMax,
}: RangeInputProps) {
  const num = parseFloat(value)
  const hasRef = refMin !== undefined && refMax !== undefined

  const isNormal = resultLabel === 'normal' || resultLabel === 'Normal'
  const isAbnormal = resultLabel && !isNormal

  // M-mode 참조범위 퍼센트 계산 (바 시각화용)
  let barPercent: number | null = null
  if (hasRef && !isNaN(num)) {
    const range = refMax! - refMin!
    barPercent = Math.min(100, Math.max(0, ((num - refMin!) / range) * 100))
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(keywordId, e.target.value)}
            className="w-24 rounded border px-2 py-1 text-sm"
            step="any"
          />
          {unit && (
            <span className="ml-1 text-xs text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

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
          <span className="text-xs text-muted-foreground">
            {commentLabel}
          </span>
        )}
      </div>

      {/* M-mode 참조범위 바 */}
      {hasRef && !isNaN(num) && (
        <div className="flex items-center gap-1">
          <span className="w-10 text-right text-[10px] text-muted-foreground">
            {refMin}
          </span>
          <div className="relative h-1.5 w-64 rounded-full bg-muted">
            {/* 정상 범위 표시 */}
            <div className="absolute inset-0 rounded-full bg-green-100" />
            {/* 현재값 마커 */}
            <div
              className={`absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full ${
                resultLabel === 'normal' ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ left: `${barPercent}%` }}
            />
          </div>
          <span className="w-10 text-[10px] text-muted-foreground">{refMax}</span>
        </div>
      )}
    </div>
  )
}

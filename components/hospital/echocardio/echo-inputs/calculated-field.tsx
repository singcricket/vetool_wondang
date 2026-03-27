'use client'

interface CalculatedFieldProps {
  keywordId: string
  unit?: string
  value: string
  resultLabel?: string
  commentLabel?: string
}

export default function CalculatedField({
  unit,
  value,
  resultLabel,
  commentLabel,
}: CalculatedFieldProps) {
  const isNormal = resultLabel === 'normal' || resultLabel === 'Normal'
  const isAbnormal = resultLabel && !isNormal

  return (
    <div className="flex items-center gap-2">
      {/* 읽기 전용 계산값 */}
      <div className="flex min-w-24 items-center rounded border bg-muted/50 px-2 py-1">
        <span className="text-xs">
          {value ? (
            <>
              <span className="font-medium">{value}</span>
              {unit && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {unit}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </div>

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

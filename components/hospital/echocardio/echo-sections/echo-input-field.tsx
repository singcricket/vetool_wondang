'use client'

import type { EchoTestUIMeta } from '@/types/echocardio/echocardio-type'
import SelectInput from '../echo-inputs/select-input'
import RangeInput from '../echo-inputs/range-input'
import TextInput from '../echo-inputs/text-input'
import CalculatedField from '../echo-inputs/calculated-field'

interface EchoInputFieldProps {
  item: EchoTestUIMeta
  value: string
  computed?: { result: string; comment: string }
  mmodeRef?: [number, number]
  onChange: (keywordId: string, value: string) => void
}

export default function EchoInputField({
  item,
  value,
  computed,
  mmodeRef,
  onChange,
}: EchoInputFieldProps) {
  return (
    <div className="flex items-start gap-3">
      {/* 항목명 */}
      <span className="w-40 shrink-0 pt-1 text-xs text-muted-foreground">
        {item.keywordName}
      </span>

      {/* 입력 컴포넌트 */}
      <div className="flex-1">
        {item.testType === 'select' && item.options && (
          <SelectInput
            item={item as any}
            value={value}
            onChange={onChange}
            resultLabel={computed?.result}
            commentLabel={computed?.comment}
          />
        )}

        {(item.testType === 'range' || item.testType === 'mmode_range') && (
          <RangeInput
            keywordId={item.keywordID}
            unit={item.unit}
            value={value}
            onChange={onChange}
            resultLabel={computed?.result}
            commentLabel={computed?.comment}
            refMin={mmodeRef?.[0]}
            refMax={mmodeRef?.[1]}
          />
        )}

        {item.testType === 'calculated' && (
          <CalculatedField
            keywordId={item.keywordID}
            unit={item.unit}
            value={value}
            resultLabel={computed?.result}
            commentLabel={computed?.comment}
          />
        )}

        {item.testType === 'other' && (
          <RangeInput
            keywordId={item.keywordID}
            unit={item.unit}
            value={value}
            onChange={onChange}
          />
        )}

        {item.testType === 'textcomment' && (
          <TextInput keywordId={item.keywordID} value={value} onChange={onChange} />
        )}
      </div>
    </div>
  )
}

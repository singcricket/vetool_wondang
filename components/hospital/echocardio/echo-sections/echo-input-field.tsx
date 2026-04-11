'use client'

import type { EchoTestUIMeta } from '@/types/echocardio/echocardio-type'
import SelectInput from '../echo-inputs/select-input'
import RangeInput from '../echo-inputs/range-input'
import TextInput from '../echo-inputs/text-input'
import CalculatedField from '../echo-inputs/calculated-field'

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

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
    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-3">
      {/* 항목명 및 툴팁 */}
      <div className="flex w-full md:w-44 shrink-0 items-center gap-1.5 pt-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {item.keywordName}
        </span>
        {item.testinfo && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 shrink-0 cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="text-xs font-normal leading-relaxed">{item.testinfo}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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

        {(item.testType === 'range' || item.testType === 'mmode_range' || item.testType === 'mmode_formula') && (
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

        {(item.testType === 'calculated' || item.testType === 'calculated_string') && (
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

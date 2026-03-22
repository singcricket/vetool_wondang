import CalculatorResult from '@/components/hospital/calculator/result/calculator-result'
import UnitInput from '@/components/hospital/calculator/unit-input'
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'

// Add X mL of 50% dextrose to bag (total volume increases)
// 50 × X = C2 × (bagVolume + X)  →  X = (C2 × bagVolume) / (50 - C2)
const STOCK_CONCENTRATION = 50

export default function Dextrose() {
  const [bagVolume, setBagVolume] = useState('500')
  const [targetConc, setTargetConc] = useState('2.5')

  const isOverConcentration = Number(targetConc) >= STOCK_CONCENTRATION

  const addVolume =
    targetConc &&
    bagVolume &&
    Number(targetConc) > 0 &&
    Number(bagVolume) > 0 &&
    !isOverConcentration
      ? (Number(targetConc) * Number(bagVolume)) /
        (STOCK_CONCENTRATION - Number(targetConc))
      : null

  const finalVolume = addVolume !== null ? Number(bagVolume) + addVolume : null

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle>당수액 조제</SheetTitle>
        <SheetDescription>
          당이 없는 수액에 50% 포도당을 첨가하여 목표 농도의 당수액 조제
        </SheetDescription>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2">
        <UnitInput
          label="수액 용량"
          id="bagVolume"
          unit="mL"
          value={bagVolume}
          onChange={(e) => setBagVolume(e.target.value)}
          placeholder="500"
        />
        <UnitInput
          label="목표 농도"
          id="targetConc"
          unit="%"
          value={targetConc}
          onChange={(e) => setTargetConc(e.target.value)}
          placeholder="2.5"
        />
      </div>

      {isOverConcentration && (
        <p className="text-sm text-destructive">
          목표 농도는 50% 미만이어야 합니다.
        </p>
      )}

      {addVolume !== null && (
        <CalculatorResult
          hasCopyButton={false}
          displayResult={
            <>
              수액{' '}
              <span className="font-bold text-primary">{bagVolume} ml</span> +
              50% 포도당{' '}
              <span className="font-bold text-primary">
                {addVolume.toFixed(1)} mL
              </span>{' '}
              <br className="sm:hidden" />→{' '}
              <span className="font-bold text-primary">{targetConc}%</span>{' '}
              포도당 수액{' '}
              <span className="font-bold text-primary">
                {finalVolume?.toFixed(1)} mL
              </span>
            </>
          }
          copyResult={`수액 ${bagVolume} ml + 50% 포도당 ${addVolume.toFixed(1)} mL → ${targetConc}% 포도당 수액 ${finalVolume?.toFixed(1)} mL`}
        />
      )}

      <VisuallyHidden />
    </div>
  )
}

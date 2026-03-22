import UnitInput from '@/components/hospital/calculator/unit-input'
import BsaToolTip from '@/components/hospital/calculator/bsa/bsa-tool-tip'
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'
import CalculatorResult from '../result/calculator-result'

export default function Bsa({ weight }: { weight: string }) {
  const [localWeight, setLocalWeight] = useState(weight)

  const result =
    localWeight !== '' &&
    Number((0.1 * Math.pow(Number(localWeight), 2 / 3)).toFixed(2))

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          BSA
          <BsaToolTip />
        </SheetTitle>
        <VisuallyHidden>
          <SheetDescription />
        </VisuallyHidden>
      </SheetHeader>

      <UnitInput
        label="체중"
        id="weight"
        unit="kg"
        wrapperClassName="w-1/2"
        value={localWeight}
        onChange={(e) => setLocalWeight(e.target.value)}
        placeholder="체중"
      />

      {result && (
        <CalculatorResult
          displayResult={
            <span className="font-bold text-primary">
              {result} m<sup>2</sup>
            </span>
          }
          copyResult={`${result.toString()} m²`}
          hasCopyButton={false}
        />
      )}
    </div>
  )
}

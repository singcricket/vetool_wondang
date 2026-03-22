import UnitInput from '@/components/hospital/calculator/unit-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type Dispatch, type SetStateAction } from 'react'
import CalculatorResult from '../../result/calculator-result'
import FactorToolTip from '../rer-mer-factor-tool-tip'

type Props = {
  localWeight: string
  setLocalWeight: Dispatch<SetStateAction<string>>
  factor: string
  setFactor: Dispatch<SetStateAction<string>>
  rer?: number
  result?: number
}

export default function MerForm({
  localWeight,
  setLocalWeight,
  factor,
  setFactor,
  rer,
  result,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <UnitInput
          label="체중"
          id="weight"
          unit="kg"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          placeholder="체중"
        />

        <UnitInput
          label="RER"
          id="rer"
          unit="kcal/day"
          value={rer ?? ''}
          readOnly
          disabled
          placeholder="RER"
        />

        <div>
          <Label htmlFor="factor" className="flex items-center gap-2">
            Life Stage Factor
            <FactorToolTip />
          </Label>
          <Input
            type="number"
            id="factor"
            className="mt-1"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            placeholder="인자"
          />
        </div>
      </div>

      {result && (
        <CalculatorResult
          displayResult={
            <span className="font-bold text-primary">
              {result.toFixed(0).toString()} kcal/day
            </span>
          }
          copyResult={`${result.toFixed(0).toString()} kcal/day`}
          hasCopyButton={false}
        />
      )}
    </div>
  )
}

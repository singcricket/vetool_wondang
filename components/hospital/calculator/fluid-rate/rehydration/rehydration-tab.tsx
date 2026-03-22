import RehydrationToolTip from '@/components/hospital/calculator/fluid-rate/rehydration/rehydration-tool-tip'
import UnitInput from '@/components/hospital/calculator/unit-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { calculateRehydration } from '@/lib/calculators/fluid-rate'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { AlertCircleIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CalculatorResult from '../../result/calculator-result'
import DehydrationTooltip from './dehydration-tooltip'

type Props = {
  weight: string
  handleLocalWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function RehydrationTab({
  weight,
  handleLocalWeightChange,
  setIsSheetOpen,
}: Props) {
  const [dehydrationRate, setDehydrationRate] = useState('5')
  const [rehydrationTime, setRehydrationTime] = useState('12')

  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const result = calculateRehydration(weight, dehydrationRate, rehydrationTime)

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span>Rehydration</span>
          <RehydrationToolTip />
        </SheetTitle>
        <VisuallyHidden>
          <SheetDescription />
        </VisuallyHidden>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2">
        <UnitInput
          label="체중"
          id="weight"
          unit="kg"
          value={weight}
          onChange={handleLocalWeightChange}
          placeholder="체중"
        />

        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-1">
            <Label htmlFor="dehydration">탈수 정도</Label>
            <DehydrationTooltip />
          </div>

          <Select onValueChange={setDehydrationRate} value={dehydrationRate}>
            <SelectTrigger className="mt-1" id="dehydration">
              <SelectValue placeholder="탈수 정도 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5%</SelectItem>
              <SelectItem value="6">6%</SelectItem>
              <SelectItem value="7">7%</SelectItem>
              <SelectItem value="8">8%</SelectItem>
              <SelectItem value="9">9%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="11">11%</SelectItem>
              <SelectItem value="12">12%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <UnitInput
          label="교정 시간"
          id="rehydrationTime"
          unit="hr"
          value={rehydrationTime}
          onChange={(e) => setRehydrationTime(e.target.value)}
          placeholder="교정 시간"
        />
      </div>

      <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <div className="flex items-center gap-1.5 font-medium">
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
          주의사항
        </div>
        <ul className="ml-5 list-disc space-y-0.5">
          <li>On-going loss 및 유지 수액(maintenance)은 별도 계산 필요</li>
        </ul>
      </div>

      {result && (
        <CalculatorResult
          displayResult={
            <>
              Rehydration fluid{' '}
              <span className="font-bold text-primary">
                {result.totalMl} mL
              </span>
              를 <br className="sm:hidden" />
              <span className="font-bold text-primary">
                {rehydrationTime} 시간
              </span>{' '}
              동안 주입 =
              <span className="font-bold text-primary">
                {result.ratePerHour.toString()} mL/hr
              </span>
            </>
          }
          copyResult={`Rehydration fluid therapy, ${result.totalMl} ml for ${rehydrationTime} hr = FR: ${result.ratePerHour} mL/hr`}
          hasInsertOrderButton={hasSelectedPatient}
          orderName="Rehydration fluid therapy"
          orderComment={`${result.totalMl} ml for ${rehydrationTime} hr = FR: ${result.ratePerHour} mL/hr`}
          orderType="fluid"
          setIsSheetOpen={setIsSheetOpen}
        />
      )}
    </div>
  )
}

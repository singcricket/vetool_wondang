import MaintenanceToolTip from '@/components/hospital/calculator/fluid-rate/maintenance/maintenance-tool-tip'
import CalculatorResult from '@/components/hospital/calculator/result/calculator-result'
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
import type { Species } from '@/constants/hospital/register/signalments'
import { calculateMaintenanceRate } from '@/lib/calculators/fluid-rate'
import type { CalcMethod, Fold } from '@/types/hospital/calculator'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CalculatorWarning from '../../calculator-warning'

type Props = {
  species?: string
  weight: string
  handleLocalWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}
export default function MaintenanceTab({
  weight,
  species,
  handleLocalWeightChange,
  setIsSheetOpen,
}: Props) {
  const [localSpecies, setLocalSpecies] = useState(species ?? 'canine')
  const [calcMethod, setCalcMethod] = useState('a')
  const [fold, setFold] = useState<Fold>('1')

  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const result = calculateMaintenanceRate(
    weight,
    localSpecies as Species,
    fold as Fold,
    calcMethod as CalcMethod,
  )

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span>Maintenance</span>
          <MaintenanceToolTip />
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

        <div>
          <Label htmlFor="species">종</Label>
          <Select onValueChange={setLocalSpecies} value={localSpecies}>
            <SelectTrigger className="mt-1" id="species">
              <SelectValue placeholder="종 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="canine">Canine</SelectItem>
              <SelectItem value="feline">Feline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="calcMethod">계산법</Label>
          <Select onValueChange={setCalcMethod} value={calcMethod}>
            <SelectTrigger className="mt-1" id="calcMethod">
              <SelectValue placeholder="계산법" />
            </SelectTrigger>
            <SelectContent>
              {localSpecies === 'canine' ? (
                <>
                  <SelectItem value="a">
                    a. 132 x (몸무게)<sup>0.75</sup> mL/day
                  </SelectItem>
                  <SelectItem value="b">b. 60 mL/kg/day</SelectItem>
                  <SelectItem value="c">
                    c. 30 x (몸무게) + 70 mL/day
                  </SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="a">
                    a. 80 x (몸무게)<sup>0.75</sup> mL/day{' '}
                  </SelectItem>
                  <SelectItem value="b">b. 40 mL/kg/day</SelectItem>
                  <SelectItem value="c">
                    c. 30 x (몸무게) + 70 mL/day
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fold">배수</Label>
          <Select
            value={fold}
            onValueChange={(value) => setFold(value as Fold)}
          >
            <SelectTrigger className="mt-1" id="fold">
              <SelectValue placeholder="배수" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="1.5">1.5</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="2.5">2.5</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="3.5">3.5</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="4.5">4.5</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CalculatorWarning>
        <li>환자 상태에 따라 조절 필요</li>
        <li className="tracking-tight">
          Pediatrics는 높은 대사율로 인해 더 많은 유지량이 필요
        </li>
        <ul className="ml-2 list-disc text-xs">
          <li>Puppy: 성견 유지속도의 약 3배 권장</li>
          <li>Kitten: 성묘 유지속도의 약 2.5배 권장</li>
        </ul>
      </CalculatorWarning>

      {result && (
        <CalculatorResult
          displayResult={
            <>
              Maintenance fluid{' '}
              <span className="font-bold text-primary">{result} mL/hr</span>
            </>
          }
          copyResult={`Maintenance fluid therapy, FR: ${result} mL/hr`}
          hasInsertOrderButton={hasSelectedPatient}
          orderName="Maintenance fluid therapy"
          orderComment={`FR: ${result} mL/hr`}
          orderType="fluid"
          setIsSheetOpen={setIsSheetOpen}
        />
      )}
    </div>
  )
}

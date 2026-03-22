import ResuscitationToolTip from '@/components/hospital/calculator/fluid-rate/resuscitation/resuscitation-tool-tip'
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
import { calculateResuscitation } from '@/lib/calculators/fluid-rate'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { AlertCircleIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'

type Props = {
  weight: string
  species?: string
  handleLocalWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}
export default function ResuscitationTab({
  species,
  weight,
  handleLocalWeightChange,
  setIsSheetOpen,
}: Props) {
  const [localSpecies, setLocalSpecies] = useState(species ?? 'canine')

  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const result = calculateResuscitation(localSpecies as Species, weight)

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span>Resuscitation</span>
          <ResuscitationToolTip />
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
      </div>

      <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <div className="flex items-center gap-1.5 font-medium">
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
          주의사항
        </div>
        <ul className="ml-5 list-disc space-y-0.5">
          <li>Buffered isotonic 수액으로 15~30분간 주입</li>
          <li>볼루스 투여 후 반드시 임상 반응 재평가</li>
          <li>반응 없으면 추가 볼루스 또는 교질액 전환 고려</li>
          <li>고양이: 과부하 위험 — 소량 분할 투여 권장</li>
        </ul>
      </div>

      {result && (
        <CalculatorResult
          displayResult={
            <>
              Buffered isotonic fluid{' '}
              <span className="font-bold text-primary">
                {result.min}~{result.max}mL
              </span>
              를 <br className="sm:hidden" />
              15~30분간 주입
            </>
          }
          copyResult={`Fluid resuscitation therapy, Buffered isotonic fluid ${result.min}~${result.max} mL for 15~30 min`}
          hasInsertOrderButton={hasSelectedPatient}
          orderName="Fluid resuscitation therapy"
          orderComment={`Buffered isotonic fluid ${result.min}~${result.max} mL for 15~30 min`}
          orderType="fluid"
          setIsSheetOpen={setIsSheetOpen}
        />
      )}
    </div>
  )
}

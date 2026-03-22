import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CalculatorWarning from '../../calculator-warning'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CriResultCard from '../cri-result-card'
import HelperTooltip from '@/components/common/helper-tooltip'

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function BicarbonateCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [baseExcess, setBaseExcess] = useState('10')

  const result = (0.3 * Number(weight) * Number(baseExcess)).toFixed(2)

  return (
    <AccordionItem value="bicarbonate">
      <AccordionTrigger>Sodium Bicarbonate (HCO3 = 1 mEq/mL)</AccordionTrigger>

      <AccordionContent className="space-y-4 px-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Label htmlFor="weight">체중</Label>
            <Input
              type="number"
              id="weight"
              className="mt-1"
              value={weight}
              onChange={handleChangeWeight}
              placeholder="체중"
            />
            <span className="absolute bottom-2 right-2 text-sm text-muted-foreground">
              kg
            </span>
          </div>

          <div className="relative">
            <Label htmlFor="baseExcess">Base Excess</Label>
            <Input
              type="number"
              id="baseExcess"
              className="mt-1"
              value={baseExcess}
              onChange={(e) => setBaseExcess(e.target.value)}
              placeholder="BE"
            />
            <span className="absolute bottom-2 right-2 text-sm text-muted-foreground">
              mEq/L
            </span>
          </div>
        </div>

        <CalculatorWarning>
          <li>BW(kg) x BE x 0.3</li>
          <li>2~6시간에 걸쳐 천천히 투여</li>
          <li>칼슘 함유 수액과 동일 라인 금지 (침전 위험)</li>
          <li>혈가스(BGA) 모니터링</li>
        </CalculatorWarning>

        {Number(result) > 0 && (
          <CriResultCard
            preparation={
              <div className="space-y-1">
                <div>
                  Sodium Bicarbonate{' '}
                  <span className="font-bold text-primary">{result} mL</span>
                </div>{' '}
                의 1/3~1/2
                <div className="text-xs font-normal text-muted-foreground">
                  (초기 교정량: {(Number(result) / 3).toFixed(2)}~
                  {(Number(result) / 2).toFixed(2)} mL)
                </div>
                <div>NS 1:1 희석</div>
              </div>
            }
            pumpSetting={
              <div className="space-y-1">2~6시간에 걸쳐 천천히 정맥 투여</div>
            }
            copyResult={`Sodium Bicarbonate CRI, 초기 교정량: ${(Number(result) / 3).toFixed(2)}~${(Number(result) / 2).toFixed(2)}ml, Mix: NS 1:1 희석하여 2~6시간 점적 투여`}
            orderName="Sodium Bicarbonate CRI"
            orderComment={`초기 교정량: ${(Number(result) / 3).toFixed(2)}~${(Number(result) / 2).toFixed(2)}ml, Mix: NS 1:1 희석하여 2~6시간 투여`}
            hasInsertOrderButton={hasSelectedPatient}
            setIsSheetOpen={setIsSheetOpen}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

import UnitInput from '@/components/hospital/calculator/unit-input'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CalculatorWarning from '../../calculator-warning'
import CriResultCard from '../cri-result-card'

const PROPOFOL_CONCENTRATION = 10 // mg/mL (1%)
const BOLUS_DOSE = 6 // mg/kg

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function PropofolCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [propofolDose, setPropofolDose] = useState('0.1')

  const bw = Number(weight)
  const dose = Number(propofolDose)
  const isValid = bw > 0 && dose >= 0.1 && dose <= 0.6

  // CRI: FR (mL/hr) = dose(mg/kg/min) × weight × 60 / concentration
  const fluidRate = (dose * bw * 60) / PROPOFOL_CONCENTRATION

  // Initial bolus
  const bolusVol = (BOLUS_DOSE * bw) / PROPOFOL_CONCENTRATION

  return (
    <AccordionItem value="propofol">
      <AccordionTrigger>Propofol (10mg/mL)</AccordionTrigger>

      <AccordionContent className="space-y-4 px-1">
        <div className="grid grid-cols-2 gap-2">
          <UnitInput
            label="체중"
            id="weight"
            unit="kg"
            value={weight}
            onChange={handleChangeWeight}
            placeholder="체중"
          />

          <UnitInput
            label="용량 (0.1 ~ 0.6)"
            id="propofolDose"
            unit="mg/kg/min"
            value={propofolDose}
            onChange={(e) => setPropofolDose(e.target.value)}
            placeholder="0.1"
          />
        </div>

        <CalculatorWarning>
          <li>고양이: 장기(6시간 이상) 반복 투여 시 하인즈 소체 빈혈 주의</li>
          <li>저혈압, 저환기 모니터링</li>
          <li>개봉 후 6시간 이내 사용, 무균 처리 필수</li>
        </CalculatorWarning>

        {isValid && (
          <CriResultCard
            preparation={
              <div className="space-y-1">
                <div>
                  Initial bolus:{' '}
                  <span className="font-bold text-primary">
                    {bolusVol.toFixed(2)} mL
                  </span>
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  (6 mg/kg IV)
                </div>
              </div>
            }
            pumpSetting={
              <div>
                Propofol FR:{' '}
                <span className="font-bold text-primary">
                  {fluidRate.toFixed(2)} mL/hr
                </span>
              </div>
            }
            copyResult={`Propofol CRI, Dose: ${propofolDose}mg/kg/min, FR: ${fluidRate.toFixed(2)}ml/hr, Initial bolus: ${bolusVol.toFixed(2)}ml`}
            orderName="Propofol CRI"
            orderComment={`Dose: ${propofolDose}mg/kg/min, FR: ${fluidRate.toFixed(2)}ml/hr, Initial bolus: ${bolusVol.toFixed(2)}ml`}
            hasInsertOrderButton={hasSelectedPatient}
            setIsSheetOpen={setIsSheetOpen}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

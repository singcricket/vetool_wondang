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

// 50 mg/vial을 2 mL D5W로 용해 → 25 mg/mL
const NITROPRUSSIDE_CONCENTRATION = 25 // mg/mL

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function NitroprussideCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [dose, setDose] = useState('1')
  const [syringeVol, setSyringeVol] = useState('30')
  const [fluidRate, setFluidRate] = useState('2')

  // 1. 시간당 필요한 니트로프루시드 용량 (mg/hr)
  const hourlyDose = (Number(dose) * Number(weight) * 60) / 1000

  // 2. 시간당 필요한 니트로프루시드 원액 용량 (mL/hr)
  const hourlyVolume = hourlyDose / NITROPRUSSIDE_CONCENTRATION

  const isImpossible = hourlyVolume >= Number(fluidRate)

  // 3. 첨가할 니트로프루시드 볼륨 (mL)
  const nitroprussideVol = isImpossible
    ? 0
    : (Number(syringeVol) * hourlyVolume) / (Number(fluidRate) - hourlyVolume)

  const totalVol = Number(syringeVol) + nitroprussideVol
  const runtime =
    Number(fluidRate) > 0 ? (totalVol / Number(fluidRate)).toFixed(1) : '0'

  const actualHourlyVolume =
    totalVol > 0 ? (nitroprussideVol * Number(fluidRate)) / totalVol : 0
  const actualMgHr = actualHourlyVolume * NITROPRUSSIDE_CONCENTRATION
  const actualUgKgMin =
    Number(weight) > 0 ? (actualMgHr * 1000) / (Number(weight) * 60) : 0

  return (
    <AccordionItem value="nitroprusside">
      <AccordionTrigger>Nitroprusside (50mg/vial)</AccordionTrigger>

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
            label="용량 (1 ~ 10)"
            id="dose"
            unit="µg/kg/min"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="1"
          />

          <UnitInput
            label="사용할 주사기"
            id="syringeVol"
            unit="cc"
            value={syringeVol}
            onChange={(e) => setSyringeVol(e.target.value)}
            placeholder="주사기 용량"
          />

          <UnitInput
            label="수액 속도"
            id="fluidRate"
            unit="mL/hr"
            value={fluidRate}
            onChange={(e) => setFluidRate(e.target.value)}
            placeholder="수액 속도"
          />
        </div>

        <CalculatorWarning>
          <li>50 mg/vial + D5W 2 mL 용해 → 25 mg/mL 기준</li>
          <li>D5W로만 조제 (NS, RLS 금지)</li>
          <li>차광 필수 (cyanide 생성)</li>
        </CalculatorWarning>

        {isImpossible ? (
          <div className="text-center text-sm font-semibold text-destructive">
            수액속도를 올리거나 약물용량을 줄이세요
          </div>
        ) : (
          Number(nitroprussideVol) > 0 && (
            <CriResultCard
              preparation={
                <div>
                  D5W{' '}
                  <span className="font-bold text-primary">
                    {syringeVol} mL
                  </span>
                  <br />
                  Nitroprusside{' '}
                  <span className="font-bold text-primary">
                    {Number(nitroprussideVol).toFixed(2)} mL
                  </span>
                </div>
              }
              pumpSetting={
                <div>
                  FR:{' '}
                  <span className="font-bold text-primary">
                    {fluidRate} mL/hr
                  </span>
                </div>
              }
              delivery={
                <div>
                  <span className="font-bold text-primary">
                    {actualUgKgMin.toFixed(2)} µg/kg/min
                  </span>
                  <br />
                  <span className="font-bold text-primary">
                    {actualMgHr.toFixed(2)} mg/hr
                  </span>
                </div>
              }
              runtime={
                <span className="font-bold text-primary">{runtime} hr</span>
              }
              copyResult={`Nitroprusside CRI, Dose: ${dose}µg/kg/min, FR: ${fluidRate}ml/hr, Mix: D5W ${syringeVol}ml + Nitroprusside ${Number(nitroprussideVol).toFixed(2)}ml`}
              orderName="Nitroprusside CRI"
              orderComment={`Dose: ${dose}µg/kg/min, FR: ${fluidRate}ml/hr, Mix: D5W ${syringeVol}ml + Nitroprusside ${Number(nitroprussideVol).toFixed(2)}ml`}
              hasInsertOrderButton={hasSelectedPatient}
              setIsSheetOpen={setIsSheetOpen}
            />
          )
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

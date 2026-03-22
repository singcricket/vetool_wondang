import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import UnitInput from '@/components/hospital/calculator/unit-input'
import CalculatorWarning from '../../calculator-warning'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CriResultCard from '../cri-result-card'

const NOREPI_CONCENTRATION = 1 // mg/mL (1mg/1mL)

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function NorepinephrineCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [norepiDose, setNorepiDose] = useState('0.05')
  const [syringeVol, setSyringeVol] = useState('30')
  const [fluidRate, setFluidRate] = useState('2')

  // 1. 시간당 필요한 노르에피네프린 용량 계산 (mg/hr)
  const hourlyDose = (Number(norepiDose) * Number(weight) * 60) / 1000 // µg → mg

  // 2. 시간당 필요한 노르에피네프린 원액 용량 계산 (mL/hr)
  const hourlyVolume = hourlyDose / NOREPI_CONCENTRATION

  // 3. 첨가할 노르에피네프린 볼륨 (mL)
  const isImpossible = hourlyVolume >= Number(fluidRate)
  const norepiVol = isImpossible
    ? 0
    : (Number(syringeVol) * hourlyVolume) / (Number(fluidRate) - hourlyVolume)

  const totalVol = Number(syringeVol) + norepiVol
  const runtime =
    Number(fluidRate) > 0 ? (totalVol / Number(fluidRate)).toFixed(1) : '0'

  const actualHourlyVolume =
    totalVol > 0 ? (norepiVol * Number(fluidRate)) / totalVol : 0
  const actualMgHr = actualHourlyVolume * NOREPI_CONCENTRATION
  const actualUgKgMin =
    Number(weight) > 0 ? (actualMgHr * 1000) / (Number(weight) * 60) : 0

  return (
    <AccordionItem value="norepinephrine">
      <AccordionTrigger>Norepinephrine (1mg/mL)</AccordionTrigger>

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
            label="용량 (0.05 ~ 3)"
            id="norepiDose"
            unit="µg/kg/min"
            value={norepiDose}
            onChange={(e) => setNorepiDose(e.target.value)}
            placeholder="노르에피네프린 용량"
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
          <li>중심정맥(CVC) 투여 권장</li>
          <li>말초 투여 시 혈관 외 유출 → 조직 괴사 주의</li>
          <li>충분한 혈량 보충(volume resuscitation) 후 투여 시작</li>
        </CalculatorWarning>

        {isImpossible ? (
          <div className="text-center text-sm font-semibold text-destructive">
            수액속도를 올리거나 약물용량을 줄이세요
          </div>
        ) : (
          Number(norepiVol) > 0 && (
            <CriResultCard
              preparation={
                <div>
                  수액{' '}
                  <span className="font-bold text-primary">
                    {syringeVol} mL
                  </span>
                  <br />
                  Norepinephrine{' '}
                  <span className="font-bold text-primary">
                    {Number(norepiVol).toFixed(2)} mL
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
              copyResult={`Norepinephrine CRI, Dose: ${norepiDose}µg/kg/min, FR: ${fluidRate}ml/hr, Mix: Fluid ${syringeVol}ml + Norepinephrine ${Number(norepiVol).toFixed(2)}ml`}
              orderName="Norepinephrine CRI"
              orderComment={`Dose: ${norepiDose}µg/kg/min, FR: ${fluidRate}ml/hr, Mix: Fluid ${syringeVol}ml + Norepinephrine ${Number(norepiVol).toFixed(2)}ml`}
              hasInsertOrderButton={hasSelectedPatient}
              setIsSheetOpen={setIsSheetOpen}
            />
          )
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

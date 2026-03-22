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

const DOBUTAMINE_CONCENTRATION = 50

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function DobutamineCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  // fluidVol에 dobutamineVol를 넣고 fluidRate 속도로 투여
  // fluidVol + dobutamineVol = totalVol
  // dobutamineDose = 개: 5 ~ 20, 고양이: 1 ~ 5 ug/kg/min
  const [dobutamineDose, setDobutamineDose] = useState('5')
  const [syringeVol, setSyringeVol] = useState('30')
  const [fluidRate, setFluidRate] = useState('2')

  // 1. 시간당 필요한 도부타민 용량 계산 (mg/hr)
  const hourlyDose = (Number(dobutamineDose) * Number(weight) * 60) / 1000

  // 2. 시간당 필요한 도부타민 원액 용량 계산 (mL/hr)
  const hourlyVolume = hourlyDose / DOBUTAMINE_CONCENTRATION

  // 3. 최종 첨가할 도부타민 용량 계산 (mL)
  // (syringeVolume + x) : fluidRate = x : hourlyVolume
  // x = (syringeVolume * hourlyVolume) / (fluidRate - hourlyVolume)
  const isImpossible = hourlyVolume >= Number(fluidRate)
  const dobutamineVol = isImpossible
    ? 0
    : (Number(syringeVol) * hourlyVolume) / (Number(fluidRate) - hourlyVolume)

  const totalVol = Number(syringeVol) + dobutamineVol
  const runtime =
    Number(fluidRate) > 0 ? (totalVol / Number(fluidRate)).toFixed(1) : '0'

  const actualHourlyVolume =
    totalVol > 0 ? (dobutamineVol * Number(fluidRate)) / totalVol : 0
  const actualMgHr = actualHourlyVolume * DOBUTAMINE_CONCENTRATION
  const actualUgKgMin =
    Number(weight) > 0 ? (actualMgHr * 1000) / (Number(weight) * 60) : 0

  return (
    <AccordionItem value="dobutamine">
      <AccordionTrigger>Dobutamine (50mg/mL)</AccordionTrigger>

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
            label="용량 (개: 5~20, 고: 1~5)"
            id="dobutamineDose"
            unit="μg/kg/min"
            value={dobutamineDose}
            onChange={(e) => setDobutamineDose(e.target.value)}
            placeholder="도부타민 용량"
          />

          <UnitInput
            label="사용할 주사기"
            id="syringeVol"
            unit="cc"
            value={syringeVol}
            onChange={(e) => setSyringeVol(e.target.value)}
            placeholder="사용할 주사기"
          />

          <UnitInput
            label="수액 속도"
            id="fluidRate"
            unit="mL/hr"
            value={fluidRate}
            onChange={(e) => setFluidRate(e.target.value)}
            placeholder="수액속도"
          />
        </div>

        <CalculatorWarning>
          <li>빈맥·부정맥 발생 시 용량 감량 또는 중단</li>
          <li>고양이: 1 µg/kg/min부터 시작 권장</li>
          <li>가급적 전용 라인 사용</li>
        </CalculatorWarning>

        {isImpossible ? (
          <div className="text-center text-sm font-semibold text-destructive">
            수액속도를 올리거나 약물용량을 줄이세요
          </div>
        ) : (
          Number(dobutamineVol) > 0 && (
            <CriResultCard
              preparation={
                <div>
                  수액{' '}
                  <span className="font-bold text-primary">
                    {syringeVol} mL
                  </span>
                  <br />
                  Dobutamine{' '}
                  <span className="font-bold text-primary">
                    {Number(dobutamineVol).toFixed(2)} mL
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
              copyResult={`Dobutamine CRI, Dose: ${dobutamineDose}μg/kg/min, FR: ${fluidRate}ml/hr, Mix: Fluid ${syringeVol}ml + Dobutamine ${Number(dobutamineVol).toFixed(2)}ml`}
              orderName="Dobutamine CRI"
              orderComment={`Dose: ${dobutamineDose}μg/kg/min, FR: ${fluidRate}ml/hr, Mix: Fluid ${syringeVol}ml + Dobutamine ${Number(dobutamineVol).toFixed(2)}ml`}
              hasInsertOrderButton={hasSelectedPatient}
              setIsSheetOpen={setIsSheetOpen}
            />
          )
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

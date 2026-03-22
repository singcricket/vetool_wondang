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

const FUROSEMIDE_CONCENTRATION = 10

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FurosemideCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  // fluidVol에 furosemideVol를 넣고 fluidRate 속도로 투여
  // fluidVol + furosemideVol = totalVol
  // furosemideDoseRate = 0.2 ~ 1 mg/kg/hr
  const [furosemideDoseRate, setFurosemideDoseRate] = useState('1')
  const [syringeVol, setSyringeVol] = useState('30')
  const [fluidRate, setFluidRate] = useState('2')

  // 1. 시간당 필요한 퓨로세미드 용량 계산 (mg/hr)
  const hourlyDose = Number(furosemideDoseRate) * Number(weight)

  // 2. 시간당 필요한 퓨로세미드 원액 용량 계산 (mL/hr)
  const hourlyVolume = hourlyDose / FUROSEMIDE_CONCENTRATION

  // 3. 주사기 용량에 맞춰 퓨로세미드와 수액의 비율 계산
  // hourlyVolume : fluidRate = x : syringeVolume
  const isImpossible = hourlyVolume >= Number(fluidRate)
  const furosemideVol = isImpossible
    ? 0
    : (Number(hourlyVolume) * Number(syringeVol)) / Number(fluidRate)

  const fluidVol = Number(syringeVol) - furosemideVol

  const runtime =
    Number(fluidRate) > 0
      ? (Number(syringeVol) / Number(fluidRate)).toFixed(1)
      : '0'

  const actualHourlyVolume =
    Number(syringeVol) > 0
      ? (furosemideVol * Number(fluidRate)) / Number(syringeVol)
      : 0
  const actualMgHr = actualHourlyVolume * FUROSEMIDE_CONCENTRATION
  const actualMgKgHr = Number(weight) > 0 ? actualMgHr / Number(weight) : 0

  return (
    <AccordionItem value="furosemide">
      <AccordionTrigger>Furosemide (10mg/mL)</AccordionTrigger>

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
            label="용량 (0.2 ~ 1)"
            id="furosemideDose"
            unit="mg/kg/hr"
            value={furosemideDoseRate}
            onChange={(e) => setFurosemideDoseRate(e.target.value)}
            placeholder="퓨로세마이드 용량"
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
          <li>저칼륨·저나트륨 등 전해질 이상 모니터링</li>
          <li>소변량(UOP) 정기적 확인</li>
          <li>신기능 저하 시 용량 감량 고려</li>
        </CalculatorWarning>

        {isImpossible ? (
          <div className="text-center text-sm font-semibold text-destructive">
            수액속도를 올리거나 약물용량을 줄이세요
          </div>
        ) : (
          Number(fluidVol) > 0 &&
          Number(furosemideVol) > 0 && (
            <CriResultCard
              preparation={
                <div>
                  수액{' '}
                  <span className="font-bold text-primary">
                    {fluidVol.toFixed(2)} mL
                  </span>
                  <br />
                  Furosemide{' '}
                  <span className="font-bold text-primary">
                    {furosemideVol.toFixed(2)} mL
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
                    {actualMgKgHr.toFixed(2)} mg/kg/hr
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
              copyResult={`Furosemide CRI, Dose: ${furosemideDoseRate}mg/kg/hr, FR: ${fluidRate}ml/hr, Mix: Fluid ${fluidVol.toFixed(2)}ml + Furosemide ${furosemideVol.toFixed(2)}ml`}
              orderName="Furosemide CRI"
              orderComment={`Dose: ${furosemideDoseRate}mg/kg/hr, FR: ${fluidRate}ml/hr, Mix: Fluid ${fluidVol.toFixed(2)}ml + Furosemide ${furosemideVol.toFixed(2)}ml`}
              hasInsertOrderButton={hasSelectedPatient}
              setIsSheetOpen={setIsSheetOpen}
            />
          )
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

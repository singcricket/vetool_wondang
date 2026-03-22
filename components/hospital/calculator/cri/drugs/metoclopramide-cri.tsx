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

const METOCLOPRAMIDE_CONCENTRATION = 5

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function MetoclopramideCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  // fluidVol에 MetoVol를 넣고 fluidRate 속도로 투여
  // fluidVol + MetoVol = totalVol
  // MetoDoseRate = 0.01 ~ 0.083mg/kg/hr (0.01mg/kg/hr ~ 2mg/kg/day)
  const [metoDoseRate, setmetoDoseRate] = useState('0.01')
  const [syringeVol, setSyringeVol] = useState('30')
  const [fluidRate, setFluidRate] = useState('2')

  // 1. 시간당 필요한 메토 용량 계산 (mg/hr)
  const hourlyDose = Number(metoDoseRate) * Number(weight)

  // 2. 시간당 필요한 메토 원액 용량 계산 (mL/hr)
  const hourlyVolume = hourlyDose / METOCLOPRAMIDE_CONCENTRATION

  // 3. 주사기 용량에 맞춰 메토와 수액의 비율 계산
  // (syringeVolume + x) : fluidRate = x : hourlyVolume
  const isImpossible = hourlyVolume >= Number(fluidRate)
  const metoVol = isImpossible
    ? 0
    : (Number(syringeVol) * hourlyVolume) / (Number(fluidRate) - hourlyVolume)

  const totalVol = Number(syringeVol) + metoVol
  const runtime =
    Number(fluidRate) > 0 ? (totalVol / Number(fluidRate)).toFixed(1) : '0'

  const actualHourlyVolume =
    totalVol > 0 ? (metoVol * Number(fluidRate)) / totalVol : 0
  const actualMgHr = actualHourlyVolume * METOCLOPRAMIDE_CONCENTRATION
  const actualMgKgHr = Number(weight) > 0 ? actualMgHr / Number(weight) : 0

  return (
    <AccordionItem value="Meto">
      <AccordionTrigger>Metoclopramide (5mg/mL)</AccordionTrigger>

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
            label="용량 (0.01 ~ 0.083)"
            id="MetoDose"
            unit="mg/kg/hr"
            value={metoDoseRate}
            onChange={(e) => setmetoDoseRate(e.target.value)}
            placeholder="메토클로프로마이드 용량"
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
          <li>경련(발작) 병력 시 사용 주의</li>
          <li>추체외로 증상(EPS) 발생 가능</li>
          <li>장폐색(obstruction) 시 금기</li>
        </CalculatorWarning>

        {isImpossible ? (
          <div className="text-center text-sm font-semibold text-destructive">
            수액속도를 올리거나 약물용량을 줄이세요
          </div>
        ) : (
          Number(metoVol) > 0 && (
            <CriResultCard
              preparation={
                <div>
                  수액{' '}
                  <span className="font-bold text-primary">
                    {syringeVol} mL
                  </span>
                  <br />
                  Metoclopramide{' '}
                  <span className="font-bold text-primary">
                    {Number(metoVol).toFixed(2)} mL
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
              copyResult={`Metoclopramide CRI, Dose: ${metoDoseRate}mg/kg/hr, FR: ${fluidRate}ml/hr, Mix: Fluid ${syringeVol}ml + Metoclopramide ${Number(metoVol).toFixed(2)}ml`}
              orderName="Metoclopramide CRI"
              orderComment={`Dose: ${metoDoseRate}mg/kg/hr, FR: ${fluidRate}ml/hr, Mix: Fluid ${syringeVol}ml + Metoclopramide ${Number(metoVol).toFixed(2)}ml`}
              hasInsertOrderButton={hasSelectedPatient}
              setIsSheetOpen={setIsSheetOpen}
            />
          )
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

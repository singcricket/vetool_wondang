import UnitInput from '@/components/hospital/calculator/unit-input'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CalculatorWarning from '../../calculator-warning'
import CriResultCard from '../cri-result-card'

const VIAL_OPTIONS = [1, 2, 5] // mg/vial
const DILUTION_OPTIONS = [10, 20, 30, 40, 50] // mL

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function RemifentanilCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [dose, setDose] = useState('0.2')
  const [vialMg, setVialMg] = useState('1')
  const [dilutionVol, setDilutionVol] = useState('20')

  const bw = Number(weight)
  const doseNum = Number(dose)
  const vialMgNum = Number(vialMg)
  const dilutionVolNum = Number(dilutionVol)

  // 작업 농도 (µg/mL) = vial(mg) × 1000 / dilutionVol(mL)
  const concentration = (vialMgNum * 1000) / dilutionVolNum

  const isValid = bw > 0 && doseNum >= 0.05 && doseNum <= 1.0

  // FR(mL/hr) = dose(µg/kg/min) × weight(kg) × 60 / concentration(µg/mL)
  const pumpRate = (doseNum * bw * 60) / concentration

  // 희석 볼륨 기준 지속 시간
  const runtimePerPrep =
    pumpRate > 0 ? (dilutionVolNum / pumpRate).toFixed(1) : '0'

  // Loading dose 볼륨 범위: 1~2 µg/kg
  const loadingVolMin = bw > 0 ? (1 * bw) / concentration : 0
  const loadingVolMax = bw > 0 ? (2 * bw) / concentration : 0

  return (
    <AccordionItem value="remifentanil">
      <AccordionTrigger>Remifentanil (1,2,5mg/vial)</AccordionTrigger>

      <AccordionContent className="space-y-4 px-1">
        <div className="grid grid-cols-2 gap-2">
          {/* 바이알 용량 선택 */}
          <div className="flex flex-col justify-end">
            <Label htmlFor="vialMg" className="mb-1">
              바이알
            </Label>
            <Select onValueChange={setVialMg} value={vialMg}>
              <SelectTrigger id="vialMg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIAL_OPTIONS.map((v) => (
                  <SelectItem key={v} value={String(v)}>
                    {v}mg/vial
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 희석 볼륨 선택 */}
          <div className="flex flex-col justify-end">
            <Label htmlFor="dilutionVol" className="mb-1">
              NS 희석량
            </Label>
            <Select onValueChange={setDilutionVol} value={dilutionVol}>
              <SelectTrigger id="dilutionVol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DILUTION_OPTIONS.map((v) => (
                  <SelectItem key={v} value={String(v)}>
                    {v} mL
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <UnitInput
            label="체중"
            id="weight"
            unit="kg"
            value={weight}
            onChange={handleChangeWeight}
            placeholder="체중"
          />

          <UnitInput
            label="용량 (개: 0.1~0.5, 고: 0.05~0.3)"
            id="remifentanilDose"
            unit="µg/kg/min"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="0.2"
          />
        </div>

        <CalculatorWarning>
          <li>
            반감기 3~5분: 중단 즉시 진통 소실 → 중단 전 장기 작용 진통제 미리
            투여
          </li>
          <li>서맥, 저혈압 모니터링</li>
          <li>고양이: 0.05 µg/kg/min부터 시작 권장</li>
        </CalculatorWarning>

        {isValid && (
          <CriResultCard
            preparation={
              <div className="space-y-1">
                <div>
                  <span className="font-bold text-primary">
                    {vialMg} mg/vial
                  </span>
                  을 NS{' '}
                  <span className="font-bold text-primary">
                    {dilutionVol} mL
                  </span>
                  로 희석
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  → {concentration.toFixed(0)} µg/mL
                </div>
                {bw > 0 && (
                  <div className="text-xs font-normal text-muted-foreground">
                    Loading (1~2 µg/kg): {loadingVolMin.toFixed(2)}~
                    {loadingVolMax.toFixed(2)} mL IV for 1min
                  </div>
                )}
              </div>
            }
            pumpSetting={
              <div>
                FR:{' '}
                <span className="font-bold text-primary">
                  {pumpRate.toFixed(2)} mL/hr
                </span>
              </div>
            }
            delivery={
              <div>
                <span className="font-bold text-primary">
                  {doseNum} µg/kg/min
                </span>
                <br />
                <span className="font-bold text-primary">
                  {(doseNum * bw * 60).toFixed(1)} µg/hr
                </span>
              </div>
            }
            runtime={
              <span className="font-bold text-primary">
                {runtimePerPrep} hr
              </span>
            }
            copyResult={`Remifentanil CRI, Dose: ${dose}µg/kg/min, FR: ${pumpRate.toFixed(2)}mL/hr (${concentration.toFixed(0)}µg/mL)${bw > 0 ? `, Loading: ${loadingVolMin.toFixed(2)}~${loadingVolMax.toFixed(2)}mL IV over 1min` : ''}`}
            orderName="Remifentanil CRI"
            orderComment={`Dose: ${dose}µg/kg/min, FR: ${pumpRate.toFixed(2)}mL/hr (${concentration.toFixed(0)}µg/mL)${bw > 0 ? `, Loading: ${loadingVolMin.toFixed(2)}~${loadingVolMax.toFixed(2)}mL IV over 1min` : ''}`}
            hasInsertOrderButton={hasSelectedPatient}
            setIsSheetOpen={setIsSheetOpen}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

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

const TRAMADOL_CONCENTRATION = 50
const LIDOCAINE_CONCENTRATION = 20
const KETAMINE_CONCENTRATION = 50

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeWeight: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function TlkCri({
  weight,
  setIsSheetOpen,
  handleChangeWeight,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [tramadolDose, setTramadolDose] = useState('1.3') // 1.3 ~ 2.6
  const [lidocaineDose, setLidocaineDose] = useState('1.5') // 0.6 ~ 1.5
  const [ketamineDose, setKetamineDose] = useState('0.6') // 0.12 ~ 1.2
  const [syringeVol, setSyringeVol] = useState('50')
  const [fluidRate, setFluidRate] = useState('2')

  // 약물 희석 용량 계산 (사용자 지정 공식 적용)
  // formula = ((dose / (flowrate / bw)) * totalml) / drug
  const calculateDrugVol = (doseStr: string, drugConc: number) => {
    const dose = Number(doseStr)
    const flowrate = Number(fluidRate)
    const bw = Number(weight)
    const totalml = Number(syringeVol)

    if (flowrate <= 0 || bw <= 0 || drugConc <= 0) return 0
    return ((dose / (flowrate / bw)) * totalml) / drugConc
  }

  const tramadolVol = calculateDrugVol(tramadolDose, TRAMADOL_CONCENTRATION)
  const lidocaineVol = calculateDrugVol(lidocaineDose, LIDOCAINE_CONCENTRATION)
  const ketamineVol = calculateDrugVol(ketamineDose, KETAMINE_CONCENTRATION)

  const totalDrugVol = tramadolVol + lidocaineVol + ketamineVol

  // 주사기 전체 용량을 mixture 총량으로 사용
  const totalMixtureVol = Number(syringeVol)
  const fluidVol = Math.max(0, totalMixtureVol - totalDrugVol)

  const isImpossible = totalDrugVol >= totalMixtureVol

  const runtime =
    Number(fluidRate) > 0 ? (totalMixtureVol / Number(fluidRate)).toFixed(1) : '0'

  // Delivery (실제 시간당 투여 용량 검증)
  const actualHourlyVolume_T = totalMixtureVol > 0 ? (tramadolVol * Number(fluidRate)) / totalMixtureVol : 0
  const actualMgKgHr_T = Number(weight) > 0 ? (actualHourlyVolume_T * TRAMADOL_CONCENTRATION) / Number(weight) : 0

  const actualHourlyVolume_L = totalMixtureVol > 0 ? (lidocaineVol * Number(fluidRate)) / totalMixtureVol : 0
  const actualMgKgHr_L = Number(weight) > 0 ? (actualHourlyVolume_L * LIDOCAINE_CONCENTRATION) / Number(weight) : 0

  const actualHourlyVolume_K = totalMixtureVol > 0 ? (ketamineVol * Number(fluidRate)) / totalMixtureVol : 0
  const actualMgKgHr_K = Number(weight) > 0 ? (actualHourlyVolume_K * KETAMINE_CONCENTRATION) / Number(weight) : 0

  const copyResultStr = `
FR: ${fluidRate} ml/hr 
( Fluid ${Number(fluidVol).toFixed(2)}ml + T ${Number(tramadolVol).toFixed(2)}ml + L ${Number(lidocaineVol).toFixed(2)}ml + K ${Number(ketamineVol).toFixed(2)}ml )`

  return (
    <AccordionItem value="TLK">
      <AccordionTrigger>MLK CRI (Tramadol/Lidocaine/Ketamine)</AccordionTrigger>

      <AccordionContent className="space-y-4 px-1">
        <div className="grid grid-cols-2 gap-2">
          <UnitInput
            label="체중"
            id="weight-tlk"
            unit="kg"
            value={weight}
            onChange={handleChangeWeight}
            placeholder="체중"
          />

          <UnitInput
            label="수액 속도"
            id="fluidRate-tlk"
            unit="mL/hr"
            value={fluidRate}
            onChange={(e) => setFluidRate(e.target.value)}
            placeholder="수액속도"
          />

          <UnitInput
            label="사용할 주사기"
            id="syringeVol-tlk"
            unit="cc"
            value={syringeVol}
            onChange={(e) => setSyringeVol(e.target.value)}
            placeholder="사용할 주사기"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <UnitInput
            label="Tramadol (1.3~2.6)"
            id="tramadolDose"
            unit="mg/kg/hr"
            value={tramadolDose}
            onChange={(e) => setTramadolDose(e.target.value)}
            placeholder="용량"
          />

          <UnitInput
            label="Lidocaine (0.6~1.5)"
            id="lidocaineDose"
            unit="mg/kg/hr"
            value={lidocaineDose}
            onChange={(e) => setLidocaineDose(e.target.value)}
            placeholder="용량"
          />

          <UnitInput
            label="Ketamine (0.12~1.2)"
            id="ketamineDose"
            unit="mg/kg/hr"
            value={ketamineDose}
            onChange={(e) => setKetamineDose(e.target.value)}
            placeholder="용량"
          />
        </div>

        <CalculatorWarning>
          <li>Tramadol 50mg/ml, Lidocaine 20mg/ml, Ketamine 50mg/ml 약물 사용기준</li>
          <li>Lidocane : Dogs can be given a max. dose of 3.0 mg/kg/hr (50 mcg/kg/min)</li>
          <li>Lidocane : Cats should be limited to a max. dose of 1.5 mg/kg/hr (25 mcg/kg/min)</li>
        </CalculatorWarning>

        {isImpossible ? (
          <div className="text-center text-sm font-semibold text-destructive">
            수액속도를 올리거나 약물용량을 줄이세요
          </div>
        ) : (
          totalDrugVol > 0 && (
            <CriResultCard
              preparation={
                <div>
                  수액{' '}
                  <span className="font-bold text-primary">
                    {Number(fluidVol).toFixed(2)} mL
                  </span>
                  <br />
                  Tramadol{' '}
                  <span className="font-bold text-primary">
                    {Number(tramadolVol).toFixed(2)} mL
                  </span>
                  <br />
                  Lidocaine{' '}
                  <span className="font-bold text-primary">
                    {Number(lidocaineVol).toFixed(2)} mL
                  </span>
                  <br />
                  Ketamine{' '}
                  <span className="font-bold text-primary">
                    {Number(ketamineVol).toFixed(2)} mL
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
                  T <span className="font-bold text-primary">{actualMgKgHr_T.toFixed(2)}</span> mg/kg/hr
                  <br />
                  L <span className="font-bold text-primary">{actualMgKgHr_L.toFixed(2)}</span> mg/kg/hr
                  <br />
                  K <span className="font-bold text-primary">{actualMgKgHr_K.toFixed(2)}</span> mg/kg/hr
                </div>
              }
              runtime={
                <span className="font-bold text-primary">{runtime} hr</span>
              }
              copyResult={copyResultStr}
              orderName={`MLK CRI
Dose: T ${tramadolDose} / L ${lidocaineDose} / K ${ketamineDose} mg/kg/hr`}
              orderComment={copyResultStr}
              hasInsertOrderButton={hasSelectedPatient}
              setIsSheetOpen={setIsSheetOpen}
            />
          )
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

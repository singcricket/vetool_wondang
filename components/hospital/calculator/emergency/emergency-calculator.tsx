import HelperTooltip from '@/components/common/helper-tooltip'
import UnitInput from '@/components/hospital/calculator/unit-input'
import { Badge } from '@/components/ui/badge'
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
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CopyButton from '../result/copy-button'
import InsertOrderButton from '../result/insert-order-button'
import CalculatorWarning from '../calculator-warning'

type Species = 'canine' | 'feline'

type EmergencyDrug = {
  name: string
  concentration: number
  concentrationLabel: string
  canineMin: number
  canineMax: number
  felineMin: number
  felineMax: number
  unit: string
  route: string
  category: string
  notes?: string
  displayUnit?: string // 설정 시 mL 대신 raw dose를 해당 단위로 표시
  pairedWith?: string // 세트 약물 표시용
  showDiluted?: boolean // true 시 "10배 희석 후 xx mL / 희석 전 xx mL" 이중 표시
}

const EMERGENCY_DRUGS: EmergencyDrug[] = [
  {
    name: 'Epinephrine',
    concentration: 1,
    concentrationLabel: '1 mg/mL (1:1000)',
    canineMin: 0.01,
    canineMax: 0.01,
    felineMin: 0.01,
    felineMax: 0.01,
    unit: 'mg/kg',
    route: 'IV / IT / IM(Anaphylaxis)',
    category: 'CPCR',
    showDiluted: true,
  },
  {
    name: 'Vasopressin',
    concentration: 20,
    concentrationLabel: '20 U/mL',
    canineMin: 0.8,
    canineMax: 0.8,
    felineMin: 0.8,
    felineMax: 0.8,
    unit: 'U/kg',
    route: 'IV',
    category: 'CPCR',
    notes: 'CPCR single dose',
  },
  {
    name: 'Atropine',
    concentration: 0.5,
    concentrationLabel: '0.5 mg/mL',
    canineMin: 0.02,
    canineMax: 0.04,
    felineMin: 0.02,
    felineMax: 0.04,
    unit: 'mg/kg',
    route: 'IV / IM / SC',
    category: '항콜린',
    notes: '고양이: 심한 빈맥(Tachycardia) 유발 주의',
  },
  {
    name: 'Glycopyrrolate',
    concentration: 0.2,
    concentrationLabel: '0.2 mg/mL',
    canineMin: 0.005,
    canineMax: 0.01,
    felineMin: 0.005,
    felineMax: 0.01,
    unit: 'mg/kg',
    route: 'IV / IM / SC',
    category: '항콜린',
  },
  {
    name: 'Lidocaine',
    concentration: 20,
    concentrationLabel: '20 mg/mL (2%)',
    canineMin: 2,
    canineMax: 4,
    felineMin: 0.25,
    felineMax: 0.25,
    unit: 'mg/kg',
    route: 'IV slow',
    category: '부정맥',
    notes: '고양이: 0.25 mg/kg 권장 (매우 천천히 투여, 독성 주의)',
  },
  {
    name: 'Diazepam',
    concentration: 5,
    concentrationLabel: '5 mg/mL',
    canineMin: 0.5,
    canineMax: 0.7,
    felineMin: 0.5,
    felineMax: 0.7,
    unit: 'mg/kg',
    route: 'IV / PR',
    category: '항경련',
  },
  {
    name: 'Midazolam',
    concentration: 5,
    concentrationLabel: '5 mg/mL',
    canineMin: 0.2,
    canineMax: 0.4,
    felineMin: 0.2,
    felineMax: 0.4,
    unit: 'mg/kg',
    route: 'IV / IM',
    category: '항경련',
  },
  {
    name: 'Levetiracetam',
    concentration: 100,
    concentrationLabel: '100 mg/mL',
    canineMin: 30,
    canineMax: 60,
    felineMin: 30,
    felineMax: 60,
    unit: 'mg/kg',
    route: 'IV slow',
    category: '항경련',
    notes: '60 mg/kg initial loading dose',
  },
  {
    name: 'Phenobarbital',
    concentration: 100,
    concentrationLabel: '100 mg/mL',
    canineMin: 4,
    canineMax: 6,
    felineMin: 4,
    felineMax: 6,
    unit: 'mg/kg',
    route: 'IV slow',
    category: '항경련',
    notes: 'Loading: 6 mg/kg IV q20-30min 반복, 최대 총 24 mg/kg',
  },
  {
    name: 'Propofol',
    concentration: 10,
    concentrationLabel: '10 mg/mL',
    canineMin: 1,
    canineMax: 6,
    felineMin: 1,
    felineMax: 6,
    unit: 'mg/kg',
    route: 'IV to effect',
    category: '항경련',
  },
  {
    name: 'Furosemide',
    concentration: 10,
    concentrationLabel: '10 mg/mL',
    canineMin: 2,
    canineMax: 4,
    felineMin: 1,
    felineMax: 2,
    unit: 'mg/kg',
    route: 'IV / IM',
    category: '이뇨제',
  },
  {
    name: 'Mannitol',
    concentration: 200,
    concentrationLabel: '200 mg/mL (20%)',
    canineMin: 500,
    canineMax: 1500,
    felineMin: 500,
    felineMax: 1500,
    unit: 'mg/kg',
    route: 'IV',
    category: '감압',
    notes: 'CRI for 15-20min, 결정 확인',
  },
  {
    name: 'Calcium Gluconate',
    concentration: 100,
    concentrationLabel: '100 mg/mL (10%)',
    canineMin: 50,
    canineMax: 100,
    felineMin: 50,
    felineMax: 100,
    unit: 'mg/kg',
    route: 'IV slow',
    category: '전해질',
    notes: 'ECG monitoring',
  },
  {
    name: 'Regular Insulin',
    concentration: 100,
    concentrationLabel: '100 U/mL',
    canineMin: 0.1,
    canineMax: 0.1,
    felineMin: 0.1,
    felineMax: 0.1,
    unit: 'U/kg',
    route: 'IV',
    category: '전해질',
    notes: 'Hyperkalemia — Dextrose와 함께 투여, 전해질 및 혈당 모니터링',
    displayUnit: 'U',
    pairedWith: 'Dextrose',
  },
  {
    name: 'Dextrose',
    concentration: 500,
    concentrationLabel: '500 mg/mL (50%) → 25% 이하 희석 후 투여',
    canineMin: 500,
    canineMax: 500,
    felineMin: 500,
    felineMax: 500,
    unit: 'mg/kg',
    route: 'IV slow',
    category: '전해질',
    notes:
      'Hyperkalemia — Regular Insulin과 함께 투여, 전해질 및 혈당 모니터링',
    pairedWith: 'Regular Insulin',
  },
  {
    name: 'Magnesium Sulfate',
    concentration: 100,
    concentrationLabel: '100 mg/mL (10%)',
    canineMin: 25,
    canineMax: 50,
    felineMin: 25,
    felineMax: 50,
    unit: 'mg/kg',
    route: 'IV slow',
    category: '전해질',
    notes: 'Torsades / refractory arrhythmia',
  },

  {
    name: 'Naloxone',
    concentration: 0.4,
    concentrationLabel: '0.4 mg/mL',
    canineMin: 0.01,
    canineMax: 0.04,
    felineMin: 0.01,
    felineMax: 0.04,
    unit: 'mg/kg',
    route: 'IV(응급) / IM / SC',
    category: '길항제',
  },
  {
    name: 'Chlorpheniramine',
    concentration: 2,
    concentrationLabel: '2 mg/mL',
    canineMin: 0.5,
    canineMax: 1,
    felineMin: 0.5,
    felineMax: 0.5,
    unit: 'mg/kg',
    route: 'IV slow / IM / SC',
    category: '항히스타민',
  },
  {
    name: 'Diphenhydramine',
    concentration: 50,
    concentrationLabel: '50 mg/mL',
    canineMin: 1,
    canineMax: 2,
    felineMin: 1,
    felineMax: 2,
    unit: 'mg/kg',
    route: 'IV slow / IM / SC',
    category: '항히스타민',
    notes: 'IV 1 mg/kg / IM, SC 2 mg/kg',
  },
  {
    name: 'Dexamethasone Sodium Phosphate',
    concentration: 5,
    concentrationLabel: '5 mg/mL',
    canineMin: 0.1,
    canineMax: 0.2,
    felineMin: 0.1,
    felineMax: 0.2,
    unit: 'mg/kg',
    route: 'IV / IM / SC',
    category: '스테로이드',
  },
  {
    name: 'Butorphanol',
    concentration: 2,
    concentrationLabel: '2 mg/mL',
    canineMin: 0.2,
    canineMax: 0.4,
    felineMin: 0.2,
    felineMax: 0.4,
    unit: 'mg/kg',
    route: 'IV / IM / SC',
    category: '진정',
  },
]

const CATEGORY_STYLES: Record<string, string> = {
  CPCR: 'bg-red-100 text-red-700 border-red-200',
  Anaphylaxis: 'bg-red-100 text-red-700 border-red-200',
  항콜린: 'bg-orange-100 text-orange-700 border-orange-200',
  부정맥: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  항경련: 'bg-purple-100 text-purple-700 border-purple-200',
  이뇨제: 'bg-blue-100 text-blue-700 border-blue-200',
  감압: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  전해질: 'bg-green-100 text-green-700 border-green-200',
  스테로이드: 'bg-teal-100 text-teal-700 border-teal-200',
  진정: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  길항제: 'bg-slate-100 text-slate-700 border-slate-200',
  항히스타민: 'bg-pink-100 text-pink-700 border-pink-200',
}

type Props = {
  weight: string
  patientSpecies?: string
  setIsSheetOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export default function EmergencyCalculator({
  weight,
  patientSpecies,
  setIsSheetOpen,
}: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const defaultSpecies: Species =
    patientSpecies === 'feline' ? 'feline' : 'canine'

  const [species, setSpecies] = useState<Species>(defaultSpecies)
  const [localWeight, setLocalWeight] = useState(weight)

  const bw = Number(localWeight)
  const isValid = bw > 0

  function calcMl(drug: EmergencyDrug, minOrMax: 'min' | 'max') {
    const dosePerKg =
      species === 'canine'
        ? minOrMax === 'min'
          ? drug.canineMin
          : drug.canineMax
        : minOrMax === 'min'
          ? drug.felineMin
          : drug.felineMax
    const totalDose = dosePerKg * bw
    return drug.displayUnit ? totalDose : totalDose / drug.concentration
  }

  function formatResult(val: number, displayUnit?: string) {
    if (displayUnit) {
      const fixed = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
      return Number(fixed).toString()
    }
    const fixed = val < 0.1 ? val.toFixed(3) : val.toFixed(2)
    return Number(fixed).toString()
  }

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          응급약물
          <HelperTooltip>
            <ul className="text-xs text-muted-foreground">
              <li>* Plumb's Veterinary Drug Handbook, 10th Edition</li>
              <li>
                * Silverstein DC, Hopper K. Small Animal Critical Care Medicine,
                2nd Edition
              </li>
              <li>
                * RECOVER Initiative: 2024 Clinical Practice Guidelines for CPR
                (Journal of Veterinary Emergency and Critical Care)
              </li>
              <li>
                * Mathews KA. Veterinary Emergency and Critical Care Manual, 3rd
                Edition
              </li>
              <li>
                * Ettinger SJ, Feldman EC. Textbook of Veterinary Internal
                Medicine, 8th Edition
              </li>
              <li>
                * Fossum TW. Small Animal Surgery, 5th Edition (Standard on IV
                Drug Administration)
              </li>
            </ul>
          </HelperTooltip>
        </SheetTitle>
        <VisuallyHidden>
          <SheetDescription />
        </VisuallyHidden>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>종</Label>
          <Select
            value={species}
            onValueChange={(v) => setSpecies(v as Species)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="canine">Canine</SelectItem>
              <SelectItem value="feline">Feline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <UnitInput
          label="체중"
          id="weight"
          unit="kg"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          placeholder="0"
        />
      </div>

      <CalculatorWarning>
        <li>반드시 제품 농도 확인</li>
      </CalculatorWarning>

      <div className="space-y-2">
        {isValid &&
          EMERGENCY_DRUGS.map((drug, index) => {
            const minVal = calcMl(drug, 'min')
            const maxVal = calcMl(drug, 'max')
            const resultUnit = drug.displayUnit ?? ' mL'

            const doseMin =
              species === 'canine' ? drug.canineMin : drug.felineMin
            const doseMax =
              species === 'canine' ? drug.canineMax : drug.felineMax
            const isSingleDose = doseMin === doseMax

            // 10배 희석 후 용량 (showDiluted 전용)
            const dilutedMin = minVal * 10
            const dilutedMax = maxVal * 10

            const orderName = `${drug.name} ${isSingleDose ? doseMin : `${doseMin}~${doseMax}`} ${drug.unit} ${drug.route}`
            const orderComment = drug.showDiluted
              ? `10배 희석 후 ${isSingleDose ? formatResult(dilutedMin) : `${formatResult(dilutedMin)}~${formatResult(dilutedMax)}`} mL (희석 전 ${isSingleDose ? formatResult(minVal) : `${formatResult(minVal)}~${formatResult(maxVal)}`} mL)`
              : `${isSingleDose ? formatResult(minVal, drug.displayUnit) : `${formatResult(minVal, drug.displayUnit)}~${formatResult(maxVal, drug.displayUnit)}`}${resultUnit}`

            const copyResult = `${drug.name} ${isSingleDose ? doseMin : `${doseMin}~${doseMax}`} ${drug.unit} ${drug.route}, ${orderComment}`

            return (
              <div
                key={`${drug.name}-${drug.route}`}
                className={`rounded-lg border bg-background p-3 pl-1 duration-500 animate-in fade-in slide-in-from-bottom-4 ${drug.pairedWith ? 'border-green-300 bg-green-50/40' : ''}`}
                style={{
                  animationFillMode: 'both',
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1">
                    {hasSelectedPatient && setIsSheetOpen ? (
                      <div className="flex flex-col gap-1">
                        <InsertOrderButton
                          orderName={orderName}
                          orderComment={orderComment}
                          setIsSheetOpen={setIsSheetOpen}
                          orderType="injection"
                          iconOnly
                        />
                        <CopyButton copyResult={copyResult} iconOnly />
                      </div>
                    ) : (
                      <CopyButton copyResult={copyResult} iconOnly />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold">
                          {drug.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`px-1 py-0 text-[10px] ${CATEGORY_STYLES[drug.category] ?? ''}`}
                        >
                          {drug.category}
                        </Badge>
                        {drug.pairedWith && (
                          <Badge
                            variant="outline"
                            className="border-green-300 bg-green-100 px-1 py-0 text-[10px] text-green-700"
                          >
                            + {drug.pairedWith} 세트
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {drug.concentrationLabel} · {drug.route}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        용량:{' '}
                        {isSingleDose
                          ? `${doseMin} ${drug.unit}`
                          : `${doseMin}~${doseMax} ${drug.unit}`}
                      </div>
                      {drug.notes &&
                        !(
                          drug.notes.startsWith('고양이') &&
                          species !== 'feline'
                        ) && (
                          <div className="mt-0.5 text-xs text-amber-600">
                            ⚠ {drug.notes}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col text-right">
                    <div className="min-w-[60px]">
                      {drug.showDiluted ? (
                        <div className="flex flex-col items-end gap-0.5">
                          {/* 희석 후 — primary 강조 */}
                          <div>
                            <span className="text-[10px] text-muted-foreground">
                              10배 희석 후{' '}
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {isSingleDose
                                ? formatResult(dilutedMin)
                                : `${formatResult(dilutedMin)}~${formatResult(dilutedMax)}`}
                            </span>
                            <span className="ml-0.5 text-sm font-medium text-primary">
                              mL
                            </span>
                          </div>
                          {/* 희석 전 — muted */}
                          <div>
                            <span className="text-[10px] text-muted-foreground">
                              희석 전{' '}
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {isSingleDose
                                ? formatResult(minVal)
                                : `${formatResult(minVal)}~${formatResult(maxVal)}`}
                            </span>
                            <span className="ml-0.5 text-xs text-muted-foreground">
                              {` ${resultUnit}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-lg font-bold text-primary">
                            {isSingleDose
                              ? formatResult(minVal, drug.displayUnit)
                              : `${formatResult(minVal, drug.displayUnit)}~${formatResult(maxVal, drug.displayUnit)}`}
                          </span>
                          <span className="ml-0.5 text-sm font-medium text-primary">
                            {` ${resultUnit}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

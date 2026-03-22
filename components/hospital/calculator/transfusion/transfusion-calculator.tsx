'use client'

import TransfusionTooltip from '@/components/hospital/calculator/transfusion/transfusion-tooltip'
import UnitInput from '@/components/hospital/calculator/unit-input'
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
import { Species } from '@/constants/hospital/register/signalments'
import { cn } from '@/lib/utils/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'
import CalculatorWarning from '../calculator-warning'

const SPECIES = [
  { value: 'canine', label: 'Canine', bloodVolume: 90 },
  { value: 'feline', label: 'Feline', bloodVolume: 60 },
] as const

type Props = {
  weight: string
  patientSpecies?: Species
}

export default function TransfusionCalculator({
  weight,
  patientSpecies,
}: Props) {
  const [species, setSpecies] = useState<Species>(patientSpecies ?? 'canine')
  const [localWeight, setLocalWeight] = useState(weight)
  const [recipientPcv, setRecipientPcv] = useState('10')
  const [targetPcv, setTargetPcv] = useState('20')
  const [donorPcv, setDonorPcv] = useState('45')

  const selectedSpecies = SPECIES.find((s) => s.value === species) ?? SPECIES[0]

  const bw = Number(localWeight)
  const recipientPcvNum = Number(recipientPcv)
  const targetPcvNum = Number(targetPcv)
  const donorPcvNum = Number(donorPcv)

  const isPcvError =
    !!recipientPcv && !!targetPcv && targetPcvNum <= recipientPcvNum

  const isValid =
    bw > 0 &&
    recipientPcvNum > 0 &&
    targetPcvNum > 0 &&
    donorPcvNum > 0 &&
    targetPcvNum > recipientPcvNum

  // transfusion volume
  const volume = isValid
    ? (bw * selectedSpecies.bloodVolume * (targetPcvNum - recipientPcvNum)) /
      donorPcvNum
    : null

  // expected PCV increase
  const expectedIncrease =
    volume && donorPcvNum
      ? (donorPcvNum * volume) / (bw * selectedSpecies.bloodVolume)
      : null

  const expectedPcv =
    expectedIncrease !== null ? recipientPcvNum + expectedIncrease : null

  const initialRateMin = bw ? bw * 0.25 : null
  const initialRateMax = bw ? bw * 0.5 : null

  const maintenanceRateMin = bw ? bw * 5 : null
  const maintenanceRateMax = bw ? bw * 10 : null

  const emergencyRate = bw ? bw * 20 : null

  const durationHours =
    volume && maintenanceRateMin ? volume / maintenanceRateMin : null

  const isLargeVolume = volume !== null && volume > bw * 20
  const isOver4Hours = durationHours !== null && durationHours > 4

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          수혈량
          <TransfusionTooltip />
        </SheetTitle>

        <VisuallyHidden>
          <SheetDescription />
        </VisuallyHidden>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label>종</Label>

          <Select
            value={species}
            onValueChange={(v) => setSpecies(v as 'canine' | 'feline')}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {SPECIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <UnitInput
          label="체중"
          id="weight"
          unit="kg"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
        />

        <UnitInput
          label="수혈동물 PCV"
          id="recipientPcv"
          unit="%"
          value={recipientPcv}
          placeholder="10"
          onChange={(e) => setRecipientPcv(e.target.value)}
          className={cn(isPcvError && 'border-red-400')}
        />

        <UnitInput
          label="목표 PCV"
          id="targetPcv"
          unit="%"
          value={targetPcv}
          placeholder="20"
          onChange={(e) => setTargetPcv(e.target.value)}
          className={cn(isPcvError && 'border-red-400')}
        />

        <UnitInput
          label="공혈 PCV"
          id="donorPcv"
          unit="%"
          value={donorPcv}
          placeholder="45"
          onChange={(e) => setDonorPcv(e.target.value)}
        />
      </div>

      {isPcvError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircleIcon className="h-4 w-4" />
          목표 PCV는 현재 PCV보다 높아야 합니다
        </div>
      )}

      {volume !== null && (
        <div className="animate-fade-up space-y-4">
          <CalculatorWarning title="수혈 전 체크리스트">
            <li>Blood typing & Cross matching</li>
            <li>Baseline vital</li>
            <li>혈액 필터 (170~260 μm) 장착</li>
            <li>생리식염수 라인 확보 (LRS 금지)</li>
          </CalculatorWarning>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1 rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                수혈량
              </div>
              <div className="text-sm font-medium leading-relaxed">
                <span className="text-lg font-bold text-primary">
                  {volume.toFixed(1)}
                </span>{' '}
                mL
              </div>
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                {bw}kg × {selectedSpecies.bloodVolume} × ({targetPcvNum} −{' '}
                {recipientPcvNum}) ÷ {donorPcvNum}
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
              <div className="text-xs font-semibold text-muted-foreground">
                초기 모니터링
              </div>
              <div className="text-sm font-medium leading-relaxed">
                <span className="font-bold text-primary">
                  {initialRateMin?.toFixed(2)}–{initialRateMax?.toFixed(2)}
                </span>{' '}
                mL/hr
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
              <div className="text-xs font-semibold text-muted-foreground">
                유지 속도
              </div>
              <div className="text-sm font-medium leading-relaxed">
                <span className="font-bold text-primary">
                  {maintenanceRateMin?.toFixed(1)}–
                  {maintenanceRateMax?.toFixed(1)}
                </span>{' '}
                mL/hr
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
              <div className="text-xs font-semibold text-muted-foreground">
                예상 소요시간 ({maintenanceRateMin?.toFixed(1)}ml/hr 기준)
              </div>
              <div className="text-sm font-medium leading-relaxed">
                <span className="font-bold text-primary">
                  {durationHours?.toFixed(1)}
                </span>{' '}
                hr
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
              <div className="text-xs font-semibold text-muted-foreground">
                최대 속도 (응급)
              </div>
              <div className="text-sm font-medium leading-relaxed">
                <span className="font-bold text-primary">
                  {emergencyRate?.toFixed(0)}
                </span>{' '}
                mL/hr
              </div>
            </div>
          </div>

          {(isLargeVolume || isOver4Hours) && (
            <CalculatorWarning>
              {isLargeVolume && (
                <li>대용량 수혈 (&gt;20 mL/kg) — 분할 투여 고려</li>
              )}
              {isOver4Hours && <li>수혈 시간은 일반적으로 4시간 이내 권장</li>}
            </CalculatorWarning>
          )}
        </div>
      )}
    </div>
  )
}

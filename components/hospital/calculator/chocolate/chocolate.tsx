import UnitInput from '@/components/hospital/calculator/unit-input'
import CalculatorWarning from '@/components/hospital/calculator/calculator-warning'
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
import {
  CHOCOLATE_TYPES,
  getToxicityLevel,
  TOXICITY_INFO,
  type ToxicityLevel,
} from '@/constants/hospital/chocolate'
import { cn } from '@/lib/utils/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Skull,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import ChocolateToolTip from './chocolate-tool-tip'

// Bar represents 0–120 mg/kg; pointer caps at 98%
const BAR_MAX = 120

// Thresholds at 20/40/60/100 → 16.7/33.3/50/83.3% of bar
const THRESHOLD_PERCENTS = [16.7, 33.3, 50, 83.3]

// Zone labels positioned at the center of each zone
const RANGE_ZONES: { key: ToxicityLevel; label: string; position: number }[] = [
  { key: 'minimal', label: '무증상', position: 8.3 },
  { key: 'mild', label: '구토·설사', position: 25 },
  { key: 'moderate', label: '빈맥·부정맥', position: 41.7 },
  { key: 'severe', label: '경련·진전', position: 66.7 },
  { key: 'critical', label: '심폐 부전', position: 91.7 },
]

const TOXICITY_ICONS: Record<ToxicityLevel, React.ReactNode> = {
  minimal: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  mild: <TriangleAlert className="h-4 w-4 shrink-0" />,
  moderate: <AlertTriangle className="h-4 w-4 shrink-0" />,
  severe: <ShieldAlert className="h-4 w-4 shrink-0" />,
  critical: <Skull className="h-4 w-4 shrink-0" />,
}

export default function Chocolate({ weight }: { weight: string }) {
  const [localWeight, setLocalWeight] = useState(weight)
  const [chocolateType, setChocolateType] = useState('')
  const [amount, setAmount] = useState('')

  const selectedType = CHOCOLATE_TYPES.find((t) => t.value === chocolateType)

  const theobromineTotal =
    selectedType && amount && Number(amount) > 0
      ? selectedType.theobrominePerGram * Number(amount)
      : null

  const theobrominePerKg =
    theobromineTotal !== null && localWeight && Number(localWeight) > 0
      ? theobromineTotal / Number(localWeight)
      : null

  const toxicityLevel =
    theobrominePerKg !== null ? getToxicityLevel(theobrominePerKg) : null
  const info = toxicityLevel ? TOXICITY_INFO[toxicityLevel] : null

  const pointerPercent =
    theobrominePerKg !== null
      ? Math.min(Math.max((theobrominePerKg / BAR_MAX) * 100, 1), 98)
      : null

  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          초콜릿 독성
          <ChocolateToolTip />
        </SheetTitle>
        <VisuallyHidden>
          <SheetDescription />
        </VisuallyHidden>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2">
        <UnitInput
          label="체중"
          id="weight"
          unit="kg"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          placeholder="체중"
        />

        <div>
          <Label htmlFor="chocolateType">초콜릿 종류</Label>
          <Select onValueChange={setChocolateType} value={chocolateType}>
            <SelectTrigger className="mt-1" id="chocolateType">
              <SelectValue placeholder="종류 선택" />
            </SelectTrigger>
            <SelectContent>
              {CHOCOLATE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span>{type.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {type.theobrominePerGram} mg/g
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <UnitInput
          label="섭취량"
          id="amount"
          unit="g"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="섭취량"
        />
      </div>

      {/* Gradient range bar — always visible */}
      <div className="space-y-1">
        <div className="relative pt-5">
          {/* ▼ pointer */}
          {pointerPercent !== null && (
            <div
              className="absolute top-0 -translate-x-1/2 transition-all duration-500 ease-out"
              style={{ left: `${pointerPercent}%` }}
            >
              <span className="text-sm leading-none text-foreground">▼</span>
            </div>
          )}

          {/* Gradient bar */}
          <div
            className="h-6 w-full rounded-full"
            style={{
              background:
                'linear-gradient(to right, #15b896 0%, #eab308 50%, #f43f5e 100%)',
            }}
          />

          {/* Threshold dividers */}
          {THRESHOLD_PERCENTS.map((pos) => (
            <div
              key={pos}
              className="absolute inset-y-5 w-px bg-white/50"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>

        {/* Zone labels */}
        <div className="relative h-8">
          {RANGE_ZONES.map((zone) => (
            <div
              key={zone.key}
              className={cn(
                'absolute -translate-x-1/2 text-center text-xs transition-all duration-300',
                toxicityLevel === zone.key
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
              style={{ left: `${zone.position}%` }}
            >
              {zone.label}
            </div>
          ))}
        </div>
      </div>

      <CalculatorWarning>
        <li>
          테오브로민은 반감기가 길어(약 17.5시간) 임상 증상이 최대 72시간까지
          지속될 수 있음
        </li>
        <li>
          장간순환(Enterohepatic recirculation)을 하므로 활성탄 반복 투여가 권장
        </li>
        <li>
          방광 안쪽 점막을 통해 재흡수될 수 있으므로 수액 처치 및 잦은 배뇨
          활성화가 필요
        </li>
        <li>
          임상 증상은 섭취 후 6~12시간이 지나서 지연되어 나타날 수 있으므로
          면밀한 모니터링이 요구됨
        </li>
      </CalculatorWarning>

      {/* Result card */}
      {theobrominePerKg !== null && info && toxicityLevel && (
        <div
          className="animate-fade-up space-y-2 rounded-lg border p-3"
          style={{
            borderColor: info.color,
          }}
        >
          <div
            className="flex items-center gap-2 font-semibold"
            style={{ color: info.color }}
          >
            {TOXICITY_ICONS[toxicityLevel]}
            <span>{info.label}</span>
            <span className="ml-auto font-bold">
              {theobrominePerKg.toFixed(1)} mg/kg
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-foreground">{info.symptoms}</p>
            <p className={cn('font-medium', info.color)}>{info.action}</p>
          </div>
        </div>
      )}
    </div>
  )
}

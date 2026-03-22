import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CALCULATORS,
  type SelectedCalculator,
} from '@/constants/hospital/icu/calculator/calculator'
import { cn } from '@/lib/utils/utils'
import {
  CandyCaneIcon,
  CookieIcon,
  DropletIcon,
  DropletsIcon,
  FlaskConicalIcon,
  HeartIcon,
  RulerIcon,
  SyringeIcon,
  UtensilsIcon,
  ZapIcon,
} from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

const CALCULATOR_ICONS: Record<SelectedCalculator, React.ReactNode> = {
  counter: <HeartIcon className="h-4 w-4" />,
  'fluid-rate': <DropletsIcon className="h-4 w-4" />,
  kcl: <FlaskConicalIcon className="h-4 w-4" />,
  'rer-mer': <UtensilsIcon className="h-4 w-4" />,
  cri: <SyringeIcon className="h-4 w-4" />,
  bsa: <RulerIcon className="h-4 w-4" />,
  chocolate: <CookieIcon className="h-4 w-4" />,
  dextrose: <CandyCaneIcon className="h-4 w-4" />,
  transfusion: <DropletIcon className="h-4 w-4" />,
  emergency: <ZapIcon className="h-4 w-4" />,
}

type Props = {
  selectedCalculator: SelectedCalculator
  setSelectedCalculator: Dispatch<SetStateAction<SelectedCalculator>>
}

export default function CalculatorSidebar({
  selectedCalculator,
  setSelectedCalculator,
}: Props) {
  return (
    <>
      {/* DESKTOP */}
      <ul className="hidden flex-col border-r md:flex">
        {CALCULATORS.map((calculator) => (
          <li key={calculator.value}>
            <Button
              className={cn(
                'h-10 w-full justify-start gap-2 rounded-none',
                selectedCalculator === calculator.value
                  ? 'border-r-2 border-primary bg-primary/10 font-medium text-primary hover:bg-primary/10'
                  : 'text-muted-foreground',
              )}
              variant="ghost"
              onClick={() => setSelectedCalculator(calculator.value)}
            >
              {CALCULATOR_ICONS[calculator.value]}
              {/* <NewFeature
                className={cn(
                  calculator.label === 'CRI' ? 'block' : 'hidden',
                  '-right-2 -top-1',
                )}
              > */}
              {calculator.label}
              {/* </NewFeature> */}
            </Button>
          </li>
        ))}
      </ul>

      {/* MOBILE */}
      <Select
        onValueChange={(value) =>
          setSelectedCalculator(value as SelectedCalculator)
        }
        value={selectedCalculator}
      >
        <SelectTrigger className="mx-3 mt-3 w-[calc(100%-100px)] md:hidden">
          <SelectValue defaultValue={selectedCalculator} />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {CALCULATORS.map((calculator) => (
              <SelectItem key={calculator.value} value={calculator.value}>
                {/* <NewFeature
                  className={cn(
                    '-right-2 -top-0.5',
                    calculator.value !== 'cri' && 'hidden',
                  )}
                > */}
                {calculator.label}
                {/* </NewFeature> */}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}

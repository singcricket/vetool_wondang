import CalculatorSidebar from '@/components/hospital/calculator/calculator-sidebar'
import SelectedCalculators from '@/components/hospital/calculator/selected-calculators'
import SelectedPatient from '@/components/hospital/calculator/selected-patient'
import {
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SelectedCalculator } from '@/constants/hospital/icu/calculator/calculator'
import useIsMobile from '@/hooks/use-is-mobile'
import type { PatientWithWeight } from '@/lib/services/patient/patient'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'

type Props = {
  patientData: PatientWithWeight | null
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function CalculatorSheetContent({
  patientData,
  setIsSheetOpen,
}: Props) {
  const isMobile = useIsMobile()

  const [selectedCalculator, setSelectedCalculator] =
    useState<SelectedCalculator>('counter')

  return (
    <SheetContent
      className="flex w-full flex-col gap-0 overflow-hidden p-0 md:w-2/3 md:flex-row xl:w-[820px]"
      noCloseButton={!isMobile}
    >
      <VisuallyHidden>
        <SheetTitle />
        <SheetDescription />
      </VisuallyHidden>

      <CalculatorSidebar
        selectedCalculator={selectedCalculator}
        setSelectedCalculator={setSelectedCalculator}
      />

      <div className="flex h-full min-h-0 w-full flex-col gap-2 p-3">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SelectedCalculators
            selectedCalculator={selectedCalculator}
            patientData={patientData}
            setIsSheetOpen={setIsSheetOpen}
          />
        </div>

        {patientData && <SelectedPatient patientData={patientData} />}
      </div>
    </SheetContent>
  )
}


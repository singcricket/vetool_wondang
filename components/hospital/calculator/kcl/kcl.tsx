import UnitInput from '@/components/hospital/calculator/unit-input'
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { KCL_SUPPLEMENT_TABLE } from '@/constants/hospital/kcl'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CalculatorResult from '../result/calculator-result'
import KclTable from './kcl-table'

type Props = {
  weight: string
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Kcl({ weight, setIsSheetOpen }: Props) {
  const { patient_id } = useParams()
  const hasSelectedPatient = Boolean(patient_id)

  const [localWeight, setLocalWeight] = useState(weight)
  const [selectedKcl, setSelectedKcl] = useState<string | null>(null)
  const [fluid, kclMl] = selectedKcl?.split('-') ?? []

  const selectedKclData = KCL_SUPPLEMENT_TABLE.find(
    (row) =>
      `ns-${row.ns500}` === selectedKcl ||
      `hs-${row.hs500}` === selectedKcl ||
      `ps-${row.ps500}` === selectedKcl,
  )

  return (
    <>
      <SheetHeader>
        <SheetTitle className="mb-3 text-left">KCl 첨가</SheetTitle>

        <VisuallyHidden>
          <SheetDescription />
        </VisuallyHidden>
      </SheetHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <UnitInput
            label="체중"
            id="weight"
            unit="kg"
            value={localWeight}
            onChange={(e) => setLocalWeight(e.target.value)}
            placeholder="체중"
          />
        </div>

        <div className="overflow-auto">
          <KclTable
            localWeight={Number(localWeight)}
            selectedKcl={selectedKcl}
            setSelectedKCl={setSelectedKcl}
          />
        </div>

        {selectedKclData && localWeight && (
          <CalculatorResult
            displayResult={
              <div>
                {fluid.toLocaleUpperCase()} + KCl{' '}
                <span className="font-bold text-primary">{kclMl}mL</span>, 최대
                수액속도 :{' '}
                <span className="font-bold text-primary">
                  {(selectedKclData.maxFluidRate * Number(localWeight)).toFixed(
                    1,
                  )}
                  mL/hr
                </span>
              </div>
            }
            copyResult={`${fluid.toLocaleUpperCase()} + KCl ${kclMl} mL, 최대 수액속도 : ${(selectedKclData.maxFluidRate * Number(localWeight)).toFixed(1)} mL/hr`}
            hasInsertOrderButton={hasSelectedPatient}
            orderType="fluid"
            orderName={`${fluid.toLocaleUpperCase()} + KCl ${kclMl} mL`}
            orderComment={`최대 수액속도 : ${(selectedKclData.maxFluidRate * Number(localWeight)).toFixed(1)} mL/hr`}
            setIsSheetOpen={setIsSheetOpen}
          />
        )}
      </div>
    </>
  )
}

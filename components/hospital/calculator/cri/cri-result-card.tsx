import { ReactNode } from 'react'
import CalculatorResult from '../result/calculator-result'

type ResultItemProps = {
  label: string
  value: ReactNode
}

function ResultItem({ label, value }: ResultItemProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="text-sm font-medium leading-relaxed">{value}</div>
    </div>
  )
}

type Props = {
  preparation?: ReactNode
  pumpSetting?: ReactNode
  delivery?: ReactNode
  runtime?: ReactNode
  copyResult: string
  orderName?: string
  orderComment?: string
  hasInsertOrderButton: boolean
  setIsSheetOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export default function CriResultCard({
  preparation,
  pumpSetting,
  delivery,
  runtime,
  copyResult,
  orderName,
  orderComment,
  hasInsertOrderButton,
  setIsSheetOpen,
}: Props) {
  return (
    <div className="animate-fade-up space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {preparation && <ResultItem label="Preparation" value={preparation} />}
        {pumpSetting && <ResultItem label="Pump setting" value={pumpSetting} />}
        {delivery && <ResultItem label="Actual delivery" value={delivery} />}
        {runtime && <ResultItem label="Runtime" value={runtime} />}
      </div>

      <CalculatorResult
        copyResult={copyResult}
        orderName={orderName}
        orderComment={orderComment}
        hasInsertOrderButton={hasInsertOrderButton}
        setIsSheetOpen={setIsSheetOpen}
        orderType="injection"
      />
    </div>
  )
}

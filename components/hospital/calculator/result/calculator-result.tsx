import { type OrderType } from '@/constants/hospital/icu/chart/order'
import CopyButton from './copy-button'
import InsertOrderButton from './insert-order-button'
import { cn } from '@/lib/utils/utils'

type Props = {
  displayResult?: React.ReactNode
  copyResult: string
  orderName?: string
  orderComment?: string
  hasCopyButton?: boolean
  hasInsertOrderButton?: boolean
  setIsSheetOpen?: React.Dispatch<React.SetStateAction<boolean>>
  orderType?: OrderType
}

export default function CalculatorResult({
  displayResult,
  copyResult,
  orderName,
  orderComment,
  hasCopyButton = true,
  hasInsertOrderButton = false,
  setIsSheetOpen,
  orderType,
}: Props) {
  return (
    <div className="flex w-full animate-fade-up flex-col rounded-lg border border-border/50 bg-muted/30 p-4">
      {displayResult && (
        <div
          className={cn(
            hasCopyButton && 'mb-2',
            'text-center text-sm font-medium tracking-tight sm:text-base',
          )}
        >
          {displayResult}
        </div>
      )}

      <div className={cn('flex flex-wrap items-center justify-center gap-2')}>
        {hasInsertOrderButton && (
          <InsertOrderButton
            orderName={orderName ?? copyResult}
            orderComment={orderComment}
            setIsSheetOpen={setIsSheetOpen}
            orderType={orderType}
          />
        )}
        {hasCopyButton && <CopyButton copyResult={copyResult} />}
      </div>
    </div>
  )
}

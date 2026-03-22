import HelperTooltip from '@/components/common/helper-tooltip'

export default function RehydrationToolTip() {
  return (
    <HelperTooltip side="bottom">
      <div className="text-xs">
        <div>Total Fluid Deficit (L) =BW(kg) x Dehydration (as a decimal)</div>
        <div>Over 12-24 hr</div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        *2024 AAHA Fluid Therapy Guidelines for Dogs and Cats
      </div>
    </HelperTooltip>
  )
}

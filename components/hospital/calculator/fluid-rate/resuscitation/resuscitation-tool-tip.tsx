import HelperTooltip from '@/components/common/helper-tooltip'

export default function ResuscitationToolTip() {
  return (
    <HelperTooltip side="bottom">
      <div className="text-xs">
        <div className="flex gap-10">
          <div>
            <div className="font-bold">개</div>
            <div>15-20mL/kg</div>
          </div>
          <div>
            <div className="font-bold">고양이</div>
            <div>5-10mL/kg</div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        *2024 AAHA Fluid Therapy Guidelines for Dogs and Cats
      </div>
    </HelperTooltip>
  )
}

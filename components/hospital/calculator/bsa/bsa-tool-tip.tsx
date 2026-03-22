import HelperTooltip from '@/components/common/helper-tooltip'

export default function BsaToolTip() {
  return (
    <HelperTooltip side="bottom">
      <div className="text-xs">
        BSA(m<sup>2</sup>) = 0.1 x BW(kg)<sup>2/3</sup>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        *종 차이는 무시할 수 있는 수준임
      </div>
    </HelperTooltip>
  )
}

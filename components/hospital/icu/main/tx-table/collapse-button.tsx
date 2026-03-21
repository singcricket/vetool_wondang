import { Button } from '@/components/ui/button'
import { ExpandIcon, ShrinkIcon } from 'lucide-react'

type Props = {
  time: number
  collapsedTime: number | null
  setCollapsedTime: (time: number | null) => void
}

export default function CollapseButton({
  time,
  collapsedTime,
  setCollapsedTime,
}: Props) {
  const isCollapsed = collapsedTime === time

  const handleClick = () => {
    setCollapsedTime(isCollapsed ? null : time)
  }

  return (
    <Button
      variant="ghost"
      className="h-7 w-7 text-muted-foreground shadow-none"
      size="sm"
      onClick={handleClick}
    >
      {isCollapsed ? (
        <ShrinkIcon style={{ width: 14 }} />
      ) : (
        <ExpandIcon style={{ width: 14 }} />
      )}
    </Button>
  )
}

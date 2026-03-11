'use client'

import GroupBadge from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/group/group-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { VITAL_REFERENCE_DATA } from '@/types/monitoring/monitoring-type'
import { ListChecks } from 'lucide-react'
import { type Dispatch, type SetStateAction, useState } from 'react'

const ALL_CL_NAMES = VITAL_REFERENCE_DATA.map((d) => d.vitalName)

type Props = {
  selectedVitals: string[]
  setSelectedVitals: Dispatch<SetStateAction<string[]>>
}

export default function MsTemplateVitalSelect({
  selectedVitals,
  setSelectedVitals,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (item: string, checked: boolean) => {
    setSelectedVitals((prev) =>
      checked ? [...prev, item] : prev.filter((v) => v !== item),
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          variant="outline"
          type="button"
          className="flex min-w-44 items-center justify-start gap-2 px-3"
        >
          <ListChecks size={16} className="shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-xs text-muted-foreground">측정항목</span>
          <GroupBadge currentGroups={selectedVitals} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>체크리스트 측정 항목 선택</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {ALL_CL_NAMES.map((item) => (
            <div key={item} className="flex flex-row items-center gap-2">
              <Checkbox
                id={`tpl-vital-${item}`}
                checked={selectedVitals.includes(item)}
                onCheckedChange={(v) => handleToggle(item, !!v)}
              />
              <Label
                htmlFor={`tpl-vital-${item}`}
                className="cursor-pointer text-sm font-normal"
              >
                {item}
              </Label>
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-end">
          <Button onClick={() => setIsOpen(false)}>확인</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

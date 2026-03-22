import SpeciesToIcon from '@/components/common/species-to-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type Diet } from '@/constants/hospital/icu/calculator/diet'
import { cn } from '@/lib/utils/utils'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { useState, type Dispatch, type SetStateAction } from 'react'

const COMPANY_BADGE_STYLES: Record<string, string> = {
  로얄캐닌: 'bg-[#e3001d] text-white border-none',
  힐스: 'bg-gradient-to-r from-[#ec1c34] to-[#0156a4] text-white border-none',
  메디비아: 'bg-[#3baeae] text-white border-none',
  시그니처바이: 'bg-[#28235d] text-white border-none',
}

function DietItem({ diet }: { diet: Diet }) {
  return (
    <div className="flex w-full justify-between">
      <div className="flex items-center gap-2">
        <SpeciesToIcon species={diet.species} />
        <span className="font-medium">{diet.name}</span>
        <Badge
          className={cn(
            'px-1.5 py-0 text-[10px]',
            COMPANY_BADGE_STYLES[diet.company] ?? '',
          )}
        >
          {diet.company}
        </Badge>
      </div>
      <span>
        {diet.mass_vol} kcal/{diet.unit}
      </span>
    </div>
  )
}

type Props = {
  diets: Diet[]
  selectedDietId: number | undefined
  setSelectedDietId: Dispatch<SetStateAction<number | undefined>>
  disabled?: boolean
}

export default function DietComboBox({
  diets,
  selectedDietId,
  setSelectedDietId,
  disabled,
}: Props) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const selectedDiet = diets.find((diet) => diet.diet_id === selectedDietId)

  return (
    <div className="col-span-2 w-full space-y-2">
      <Label>사료</Label>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isPopoverOpen}
            size="default"
            className="flex w-full justify-between px-3"
          >
            {selectedDiet ? <DietItem diet={selectedDiet} /> : '사료 선택'}
            <CaretSortIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="사료명 검색" className="h-9" />
            <CommandList>
              <ScrollArea className="h-64">
                <CommandEmpty>검색된 사료 없음</CommandEmpty>
                <CommandGroup>
                  {diets.map((diet) => (
                    <CommandItem
                      key={diet.diet_id}
                      value={diet.name}
                      onSelect={() => {
                        setSelectedDietId(diet.diet_id)
                        setIsPopoverOpen(false)
                      }}
                      className="flex justify-between"
                    >
                      <DietItem diet={diet} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

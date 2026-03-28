'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { SEX, CANINE_BREEDS, FELINE_BREEDS } from '@/constants/hospital/register/signalments'
import { registerPatientAndEchoChart } from '@/lib/services/echocardio/register-echo'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CaretSortIcon } from '@radix-ui/react-icons'

interface Props {
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function EchoNewPatientTab({
  hosId,
  targetDate,
  setOpen,
  onRegistered,
}: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [birthOpen, setBirthOpen] = useState(false)
  const [breedOpen, setBreedOpen] = useState(false)

  const [name, setName] = useState('')
  const [hosPatientId, setHosPatientId] = useState('')
  const [species, setSpecies] = useState<'canine' | 'feline' | ''>('')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState('')
  const [birth, setBirth] = useState<Date | undefined>(undefined)
  const [ownerName, setOwnerName] = useState('')
  const [hosOwnerId, setHosOwnerId] = useState('')

  const BREEDS = species === 'canine' ? CANINE_BREEDS : FELINE_BREEDS
  const isValid = name && hosPatientId && species && breed && gender && birth

  async function handleSubmit() {
    if (!isValid) return
    setIsPending(true)
    const echoId = await registerPatientAndEchoChart({
      hosId,
      examDate: targetDate,
      patient: {
        name,
        hos_patient_id: hosPatientId,
        species,
        breed: breed.split('#')[0],
        gender,
        birth: format(birth!, 'yyyy-MM-dd'),
        owner_name: ownerName || undefined,
        hos_owner_id: hosOwnerId || undefined,
      },
    })
    onRegistered()
    setOpen(false)
    router.push(`/hospital/${hosId}/echocardio/${targetDate}/${echoId}`)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 환자명 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="echo-name" className="text-xs">
          환자 이름 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="echo-name"
          className="h-8"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* 환자번호 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="echo-chart-no" className="text-xs">
          환자 번호 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="echo-chart-no"
          className="h-8"
          value={hosPatientId}
          onChange={(e) => setHosPatientId(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* 종 */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          종 <span className="text-destructive">*</span>
        </Label>
        <Select
          value={species}
          onValueChange={(v) => {
            setSpecies(v as 'canine' | 'feline')
            setBreed('')
          }}
        >
          <SelectTrigger className={cn('h-8', !species && 'text-muted-foreground')}>
            <SelectValue placeholder="종을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="canine" className="text-xs">Canine</SelectItem>
            <SelectItem value="feline" className="text-xs">Feline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 품종 */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          품종 <span className="text-destructive">*</span>
        </Label>
        <Popover open={breedOpen} onOpenChange={setBreedOpen} modal>
          <PopoverTrigger asChild disabled={!species}>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                'relative h-8 w-full justify-start pl-3 font-normal',
                !breed && 'text-muted-foreground',
              )}
            >
              {breed ? breed.split('#')[0] : species ? '품종 선택' : '종 선택'}
              <CaretSortIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            side="bottom"
          >
            <Command>
              <CommandInput placeholder="품종 검색" className="h-8 text-xs" />
              <CommandList>
                <ScrollArea className="h-48">
                  <CommandEmpty>
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      검색 결과 없음
                    </p>
                  </CommandEmpty>
                  <CommandGroup>
                    {BREEDS.map((b) => (
                      <CommandItem
                        key={b.id + b.eng}
                        value={b.eng + '#' + b.kor}
                        onSelect={(v) => {
                          setBreed(v)
                          setBreedOpen(false)
                        }}
                        className="text-xs"
                      >
                        {b.kor} ({b.eng})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* 성별 */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          성별 <span className="text-destructive">*</span>
        </Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className={cn('h-8', !gender && 'text-muted-foreground')}>
            <SelectValue placeholder="성별 선택" />
          </SelectTrigger>
          <SelectContent>
            {SEX.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 생년월일 */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          생년월일 <span className="text-destructive">*</span>
        </Label>
        <Popover open={birthOpen} onOpenChange={setBirthOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-8 w-full justify-start pl-3 font-normal',
                !birth && 'text-muted-foreground',
              )}
            >
              {birth ? format(birth, 'yyyy-MM-dd') : '날짜 선택'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birth}
              onSelect={(d) => {
                setBirth(d)
                setBirthOpen(false)
              }}
              locale={ko}
              captionLayout="dropdown-buttons"
              fromYear={2000}
              toYear={new Date().getFullYear()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 보호자 이름 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="echo-owner" className="text-xs">
          보호자 이름
        </Label>
        <Input
          id="echo-owner"
          className="h-8"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
        />
      </div>

      {/* 보호자 번호 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="echo-owner-id" className="text-xs">
          보호자 번호
        </Label>
        <Input
          id="echo-owner-id"
          className="h-8"
          value={hosOwnerId}
          onChange={(e) => setHosOwnerId(e.target.value)}
        />
      </div>

      {/* 버튼 */}
      <div className="col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          닫기
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!isValid || isPending}
          onClick={handleSubmit}
        >
          {isPending ? '등록 중...' : '등록'}
        </Button>
      </div>
    </div>
  )
}

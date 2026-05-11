'use no memo'

import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { MessageCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/utils'
import { registerPatientFormSchema } from '@/lib/schemas/patient/patient-schema'
import { CANINE_BREEDS, FELINE_BREEDS, SEX } from '@/constants/hospital/register/signalments'
import { isHosPatientIdDuplicated } from '@/lib/services/patient/patient'
import { registerPatientAndOphthalmicChart } from '@/lib/services/ophthalmic/register-ophthalmic'
import { useOphthalmicContext } from '@/providers/ophthalmic-context-provider'
import BirthDatePicker from '@/components/common/patients/form/birth-date-picker'
import HelperTooltip from '@/components/common/helper-tooltip'
import InputSuffix from '@/components/common/input-suffix'
import RequiredFieldDot from '@/components/common/requied-field-dot'
import SubmitButton from '@/components/common/submit-button'
import { toast } from 'sonner'

interface Props {
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function OphthalmicNewPatientTab({
  hosId,
  targetDate,
  setOpen,
  onRegistered,
}: Props) {
  const { push } = useRouter()
  const { vetsList } = useOphthalmicContext()
  const [breedOpen, setBreedOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVet, setSelectedVet] = useState<string>('none')

  const form = useForm<z.infer<typeof registerPatientFormSchema>>({
    resolver: zodResolver(
      registerPatientFormSchema.refine(
        async (data) => {
          const isDuplicate = await isHosPatientIdDuplicated(
            data.hos_patient_id,
            hosId,
          )
          return !isDuplicate
        },
        {
          message: '이 환자 번호는 이미 존재합니다',
          path: ['hos_patient_id'],
        },
      ),
    ),
    defaultValues: {
      name: '',
      hos_patient_id: '',
      species: undefined,
      breed: undefined,
      gender: undefined,
      birth: undefined,
      microchip_no: '',
      memo: '',
      weight: '',
      owner_name: '',
      hos_owner_id: '',
    },
  })

  const watchSpecies = form.watch('species')
  const watchBreed = form.watch('breed')
  const BREEDS = watchSpecies === 'canine' ? CANINE_BREEDS : FELINE_BREEDS

  useEffect(() => {
    if (watchBreed) setBreedOpen(false)
  }, [watchBreed])

  const handleRegister = async (
    values: z.infer<typeof registerPatientFormSchema>,
  ) => {
    setIsSubmitting(true)

    try {
      const {
        birth, breed, gender, hos_owner_id, hos_patient_id,
        name, species, owner_name,
      } = values

      const formattedBirth = format(birth, 'yyyy-MM-dd')
      const cleanBreed = breed.split('#')[0]

      const chartId = await registerPatientAndOphthalmicChart({
        hosId,
        chartDate: targetDate,
        patient: {
          hos_patient_id,
          hos_owner_id: hos_owner_id || undefined,
          name,
          species,
          breed: cleanBreed,
          gender,
          birth: formattedBirth,
          owner_name: owner_name ?? undefined,
        },
        vetId: selectedVet === 'none' ? null : selectedVet,
      })

      onRegistered()
      setOpen(false)
      push(`/hospital/${hosId}/ophthalmic/${targetDate}/${chartId}`)
    } catch (e: any) {
      toast.error(e.message || '등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleRegister)}
        className="grid grid-cols-2 gap-4"
      >
        {/* 환자 이름 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                환자 이름 <RequiredFieldDot />
              </FormLabel>
              <FormControl>
                <Input {...field} className="h-8" autoComplete="off" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 환자 번호 */}
        <FormField
          control={form.control}
          name="hos_patient_id"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <FormLabel>
                  환자 번호 <RequiredFieldDot />
                </FormLabel>
                <HelperTooltip side="right">
                  메인차트에 등록되어있는 환자번호
                </HelperTooltip>
              </div>
              <FormControl>
                <Input {...field} value={field.value || ''} className="h-8" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 종 */}
        <FormField
          control={form.control}
          name="species"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                종 <RequiredFieldDot />
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  form.setValue('breed', '')
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn('h-8', !field.value && 'text-muted-foreground')}
                  >
                    <SelectValue placeholder="종을 선택해주세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="canine" className="text-xs">Canine</SelectItem>
                  <SelectItem value="feline" className="text-xs">Feline</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 품종 */}
        <FormField
          control={form.control}
          name="breed"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <FormLabel>
                  품종 <RequiredFieldDot />
                </FormLabel>
              </div>
              <Popover open={breedOpen} onOpenChange={setBreedOpen} modal>
                <PopoverTrigger asChild disabled={!watchSpecies}>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'relative h-8 w-full justify-start pl-3 font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value
                        ? field.value.split('#')[0]
                        : watchSpecies
                          ? '품종 선택'
                          : '종 선택'}
                      <CaretSortIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                  side="bottom"
                >
                  <Command>
                    <CommandInput placeholder="품종 검색" className="h-8 text-xs" />
                    <CommandList>
                      <ScrollArea className="h-64">
                        <CommandEmpty>
                          <p className="py-4 text-center text-xs text-muted-foreground">
                            품종 검색 결과 없음
                          </p>
                        </CommandEmpty>
                        <CommandGroup>
                          {BREEDS.map((breed) => (
                            <CommandItem
                              value={breed.eng + '#' + breed.kor}
                              key={breed.id + breed.eng}
                              onSelect={field.onChange}
                              className="text-xs"
                            >
                              {breed.kor} ({breed.eng})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </ScrollArea>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 성별 */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                성별 <RequiredFieldDot />
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger
                    className={cn('h-8', !field.value && 'text-muted-foreground')}
                  >
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SEX.map((sex) => (
                    <SelectItem key={sex.value} value={sex.value} className="text-xs">
                      {sex.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 생년월일 */}
        <BirthDatePicker form={form} birth={new Date()} />

        {/* 보호자 이름 */}
        <FormField
          control={form.control}
          name="owner_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>보호자 이름</FormLabel>
              <FormControl>
                <Input {...field} className="h-8" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 담당 수의사 */}
        <FormItem>
          <FormLabel>담당 수의사</FormLabel>
          <Select value={selectedVet} onValueChange={setSelectedVet}>
            <FormControl>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="담당의 선택" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">미지정</SelectItem>
              {vetsList.map((vet) => (
                <SelectItem key={vet.user_id} value={vet.user_id}>
                  {vet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        {/* 버튼 */}
        <div className="col-span-2 flex items-center justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => setOpen(false)}
          >
            닫기
          </Button>
          <SubmitButton buttonText="등록" isPending={isSubmitting} className="bg-blue-600 hover:bg-blue-700" />
        </div>
      </form>
    </Form>
  )
}

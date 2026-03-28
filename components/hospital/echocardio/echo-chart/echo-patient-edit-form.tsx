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
import { cn } from '@/lib/utils/utils'
import { registerPatientFormSchema } from '@/lib/schemas/patient/patient-schema'
import { CANINE_BREEDS, FELINE_BREEDS, SEX } from '@/constants/hospital/register/signalments'
import { updatePatientFromPatientRoute } from '@/lib/services/patient/patient'
import { upsertEchoResult } from '@/lib/services/echocardio/update-echo'
import BirthDatePicker from '@/components/common/patients/form/birth-date-picker'
import HelperTooltip from '@/components/common/helper-tooltip'
import InputSuffix from '@/components/common/input-suffix'
import RequiredFieldDot from '@/components/common/requied-field-dot'
import SubmitButton from '@/components/common/submit-button'
import { toast } from 'sonner'
import type { EchoChartWithPatient } from '@/types/echocardio/echocardio-type'

interface Props {
  patient: EchoChartWithPatient['patient']
  patientId: string
  echoId: string
  patientWeight: string
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function EchoPatientEditForm({
  patient,
  patientId,
  echoId,
  patientWeight,
  setIsDialogOpen,
}: Props) {
  const { refresh } = useRouter()
  const [breedOpen, setBreedOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof registerPatientFormSchema>>({
    resolver: zodResolver(registerPatientFormSchema),
    defaultValues: {
      name: patient.name,
      hos_patient_id: patient.hos_patient_id,
      species: patient.species as any,
      breed: patient.breed ?? '',
      gender: patient.gender,
      birth: new Date(patient.birth),
      microchip_no: patient.microchip_no ?? '',
      memo: patient.memo ?? '',
      weight: patientWeight ?? '',
      owner_name: patient.owner_name ?? '',
      hos_owner_id: patient.hos_owner_id ?? '',
    },
  })

  const watchSpecies = form.watch('species')
  const watchBreed = form.watch('breed')
  const BREEDS = watchSpecies === 'canine' ? CANINE_BREEDS : FELINE_BREEDS

  useEffect(() => {
    if (watchBreed) setBreedOpen(false)
  }, [watchBreed])

  const handleUpdate = async (values: z.infer<typeof registerPatientFormSchema>) => {
    setIsSubmitting(true)

    await updatePatientFromPatientRoute(
      {
        birth: format(values.birth, 'yyyy-MM-dd'),
        breed: values.breed.split('#')[0],
        gender: values.gender,
        hos_patient_id: values.hos_patient_id,
        memo: values.memo,
        microchip_no: values.microchip_no,
        name: values.name,
        species: values.species,
        owner_name: values.owner_name,
        hos_owner_id: values.hos_owner_id,
        weight: values.weight,
      },
      patientId,
      false,
    )

    // 몸무게를 echo_results에도 BW_kg으로 저장
    if (values.weight) {
      await upsertEchoResult({
        echoChartId: echoId,
        keywordId: 'BW_kg',
        value: values.weight,
        allValues: { BW_kg: values.weight },
      })
    }

    toast.success('환자 정보를 수정하였습니다')
    setIsSubmitting(false)
    setIsDialogOpen(false)
    refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleUpdate)}
        className="grid grid-cols-2 gap-4"
      >
        {/* 환자 이름 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>환자 이름 <RequiredFieldDot /></FormLabel>
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
                <FormLabel>환자 번호 <RequiredFieldDot /></FormLabel>
                <HelperTooltip side="right">메인차트에 등록되어있는 환자번호</HelperTooltip>
              </div>
              <FormControl>
                <Input {...field} className="h-8" />
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
              <FormLabel>종 <RequiredFieldDot /></FormLabel>
              <Select
                onValueChange={(v) => { field.onChange(v); form.setValue('breed', '') }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className={cn('h-8', !field.value && 'text-muted-foreground')}>
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
                <FormLabel>품종 <RequiredFieldDot /></FormLabel>
                <HelperTooltip side="right">
                  <div className="flex items-center">
                    품종이 없을 경우 &apos;기타종&apos;으로 등록 후 피드백
                    <MessageCircleIcon size={12} className="mx-1" />
                    부탁드립니다
                  </div>
                </HelperTooltip>
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
                      {field.value ? field.value.split('#')[0] : watchSpecies ? '품종 선택' : '종 선택'}
                      <CaretSortIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom">
                  <Command>
                    <CommandInput placeholder="품종 검색" className="h-8 text-xs" />
                    <CommandList>
                      <ScrollArea className="h-64">
                        <CommandEmpty>
                          <p className="py-4 text-center text-xs text-muted-foreground">품종 검색 결과 없음</p>
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
              <FormLabel>성별 <RequiredFieldDot /></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={cn('h-8', !field.value && 'text-muted-foreground')}>
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SEX.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 생년월일 */}
        <BirthDatePicker form={form} birth={new Date(patient.birth)} />

        {/* 마이크로칩 */}
        <FormField
          control={form.control}
          name="microchip_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel>마이크로칩 번호</FormLabel>
              <FormControl><Input {...field} className="h-8" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 몸무게 */}
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>몸무게</FormLabel>
              <div className="relative">
                <FormControl><Input {...field} className="h-8" /></FormControl>
                <InputSuffix text="kg" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 보호자 이름 */}
        <FormField
          control={form.control}
          name="owner_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>보호자 이름</FormLabel>
              <FormControl><Input {...field} className="h-8" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 보호자 번호 */}
        <FormField
          control={form.control}
          name="hos_owner_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>보호자 번호</FormLabel>
              <FormControl><Input {...field} className="h-8" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 버튼 */}
        <div className="col-span-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => setIsDialogOpen(false)}
          >
            닫기
          </Button>
          <SubmitButton buttonText="수정" isPending={isSubmitting} />
        </div>
      </form>
    </Form>
  )
}

'use client'

import SubmitButton from '@/components/common/submit-button'
import UserAvatar from '@/components/hospital/common/user-avatar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateMsVet } from '@/lib/services/monitoring/update-ms'
import { cn } from '@/lib/utils/utils'
import { Vet } from '@/types'
import { MsVetSub } from '@/types/monitoring/monitoring-type'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

type Props = {
  mainVet: string | null
  subVet: MsVetSub
  vetsList: Vet[]   
  setIsDialogOpen: (open: boolean) => void
  sessionId: string
  primaryVet: string | null
}

export default function MsVetsUpdateForm({ mainVet, primaryVet, subVet, vetsList, setIsDialogOpen, sessionId }: Props) {
  const vetsFormSchema = z.object({
    main_vet: z.string().optional(),
    primary: z.string().optional(),
    secondary: z.string().optional(),
    anesthesia: z.string().optional(),
    other: z.string().optional(),
  })

  
//   const mainvet = vetsList.find(
//     (vet) => vet.user_id === mainVet,
//   )
//   const primary = subVet.primary
//   const anesthesia = subVet.anesthesia
//   const secondary = subVet.secondary
//   const other = subVet.other 


  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateMainAndSubVet = async (
    values: z.infer<typeof vetsFormSchema>,
  ) => {
    const { main_vet, anesthesia, primary, secondary, other } = values

    setIsUpdating(true)

    const vetInput: MsVetSub & { main_vet: string, primary_vet: string } = {
      main_vet: main_vet ?? '',
      anesthesia: anesthesia ?? '',
      primary_vet: primary ?? '',
      secondary: secondary ?? '',
      other: other ?? '',
    }
    console.log(vetInput)
    await updateMsVet(sessionId, vetInput)

    toast.success('담당수의사 변경하였습니다')

    setIsUpdating(false)

    setIsDialogOpen(false)
  }

  const form = useForm<z.infer<typeof vetsFormSchema>>({
    resolver: zodResolver(vetsFormSchema),
    defaultValues: {
      main_vet: mainVet ?? '',
      primary: primaryVet?? '',
      secondary: subVet.secondary,
      anesthesia: subVet.anesthesia,
      other: subVet.other,
    },
  })

  return (
  
       

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdateMainAndSubVet)}
            className="grid grid-cols-6 gap-4"
          >
            <FormField
              control={form.control}
              name="main_vet"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>주치의</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'h-8 text-sm',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <SelectValue placeholder="주치의 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        {
                          user_id: 'null',
                          name: '미선택',
                          position: '',
                          avatar_url: '',
                        },
                        ...vetsList,
                      ].map((vet) => (
                        <SelectItem key={vet.user_id} value={vet.user_id}>
                          <div className="flex items-center gap-2">
                            {vet.avatar_url && (
                              <UserAvatar src={vet.avatar_url} alt={vet.name} />
                            )}
                            <span>{vet.name}</span>
                            <span className="text-xs">({vet.position})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>술자</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'h-8 text-sm',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <SelectValue placeholder="술자 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        {
                          user_id: 'null',
                          name: '미선택',
                          position: '',
                          avatar_url: '',
                        },
                        ...vetsList,
                      ].map((vet) => (
                        <SelectItem
                          key={vet.user_id}
                          value={vet.user_id}
                          className="w-full"
                        >
                          <div className="flex items-center gap-2">
                            {vet.avatar_url && (
                              <UserAvatar src={vet.avatar_url} alt={vet.name} />
                            )}

                            <span>{vet.name}</span>
                            {vet.position && (
                              <span className="text-xs">({vet.position})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="anesthesia"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>마취의</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'h-8 text-sm',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <SelectValue placeholder="마취의 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        {
                          user_id: 'null',
                          name: '미선택',
                          position: '',
                          avatar_url: '',
                        },
                        ...vetsList,
                      ].map((vet) => (
                        <SelectItem
                          key={vet.user_id}
                          value={vet.user_id}
                          className="w-full"
                        >
                          <div className="flex items-center gap-2">
                            {vet.avatar_url && (
                              <UserAvatar src={vet.avatar_url} alt={vet.name} />
                            )}

                            <span>{vet.name}</span>
                            {vet.position && (
                              <span className="text-xs">({vet.position})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondary"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>보조술자</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'h-8 text-sm',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <SelectValue placeholder="보조자 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        {
                          user_id: 'null',
                          name: '미선택',
                          position: '',
                          avatar_url: '',
                        },
                        ...vetsList,
                      ].map((vet) => (
                        <SelectItem
                          key={vet.user_id}
                          value={vet.user_id}
                          className="w-full"
                        >
                          <div className="flex items-center gap-2">
                            {vet.avatar_url && (
                              <UserAvatar src={vet.avatar_url} alt={vet.name} />
                            )}

                            <span>{vet.name}</span>
                            {vet.position && (
                              <span className="text-xs">({vet.position})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="other"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>보조술자2</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'h-8 text-sm',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <SelectValue placeholder="보조자 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        {
                          user_id: 'null',
                          name: '미선택',
                          position: '',
                          avatar_url: '',
                        },
                        ...vetsList,
                      ].map((vet) => (
                        <SelectItem
                          key={vet.user_id}
                          value={vet.user_id}
                          className="w-full"
                        >
                          <div className="flex items-center gap-2">
                            {vet.avatar_url && (
                              <UserAvatar src={vet.avatar_url} alt={vet.name} />
                            )}

                            <span>{vet.name}</span>
                            {vet.position && (
                              <span className="text-xs">({vet.position})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className={cn('col-span-6 ml-auto flex gap-2 font-semibold')}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </Button>

              <SubmitButton buttonText="수정" isPending={isUpdating} />
            </div>
          </form>
        </Form>
    
  )
}

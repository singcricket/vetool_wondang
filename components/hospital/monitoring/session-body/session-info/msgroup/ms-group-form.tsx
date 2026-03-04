'use no memo'

import SubmitButton from '@/components/common/submit-button'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { groupCheckFormSchema } from '@/lib/schemas/icu/chart/chart-info-schema'
import { updateMsGroup } from '@/lib/services/monitoring/update-ms'
import { cn } from '@/lib/utils/utils'
import { type Dispatch, type SetStateAction, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {  toast } from 'sonner'
import { z } from 'zod'

type Props = {
  sessionId: string
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
  form: UseFormReturn<z.infer<typeof groupCheckFormSchema>>
  groupListData: string[]
}

export default function MsGroupForm({
  sessionId,
  setIsDialogOpen,
  form,
  groupListData,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values: z.infer<typeof groupCheckFormSchema>) => {
    setIsSubmitting(true)

    const updatems = await updateMsGroup(sessionId, values.groupList)
    // console.log(values.groupList)
    if (updatems) {
      toast.success('그룹을 변경하였습니다')
    } else {
      toast.error('그룹 변경에 실패하였습니다')
    }

    setIsSubmitting(false)
    setIsDialogOpen(false)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col"
      >
        <FormField
          control={form.control}
          name="groupList"
          render={() => (
            <FormItem>
              {groupListData.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="groupList"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-center gap-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            name={item}
                            id={item}
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item,
                                    ),
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel
                          className="cursor-pointer text-sm"
                          htmlFor={item}
                        >
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className={cn('ml-auto')}>
          <DialogClose asChild>
            <Button tabIndex={-1} variant="outline" size="sm">
              닫기
            </Button>
          </DialogClose>

          <SubmitButton buttonText="수정" isPending={isSubmitting} />
        </DialogFooter>
      </form>
    </Form>
  )
}

'use client'

import SubmitButton from '@/components/common/submit-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { templateFormSchema } from '@/lib/schemas/icu/chart/template-schema'
import { createTemplateChart } from '@/lib/services/icu/template/template'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { createMsTemplateChart } from '@/lib/services/monitoring/ms-register'
import { MsMemo, VitalResults } from '@/types/monitoring/monitoring-type'
import { zodResolver } from '@hookform/resolvers/zod'
import { BookmarkPlusIcon } from 'lucide-react'
import { memo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const DEFAULT_FORM_VALUES = {
  template_name: undefined,
  template_comment: undefined,
} as const

type Props = {
  msData : MsWithPatientWithWeight
  hosId: string
}

export default function MsAddTemplateDialog({
  msData,
  hosId,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const handleSubmit = async (values: z.infer<typeof templateFormSchema>) => {
    const { template_comment, template_name } = values

    setIsSubmitting(true)
    const template_vital_rusults:VitalResults = [];
    msData.vital_results?.forEach((vital_result) => {
      template_vital_rusults.push({
       vitals:[],
        minTime:vital_result.minTime,
        create_timestamp:vital_result.create_timestamp,
       })
    })
    const template_memo_tx : MsMemo[] = []
    msData.memo_tx.map((memo)=>{
      !memo.is_realtime_memo && template_memo_tx.push({
        id:memo.id,
        memo : memo.memo,
        check: "",
        color : memo.color,
        chosen : false,
        img_url:memo.img_url,
        is_done:false,
        has_imgs:memo.has_imgs,
        done_timestamp:"",
        create_timestamp:memo.create_timestamp,
        is_realtime_memo:false
      })
    })

 
 
   console.log(template_vital_rusults)

    await createMsTemplateChart(
      hosId,
      template_name,
      template_comment ?? '',
      template_vital_rusults,
      template_memo_tx,
      msData
    )

    toast.success('템플릿을 추가하였습니다')

    setIsSubmitting(false)
    setIsDialogOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) form.reset(DEFAULT_FORM_VALUES)
    setIsDialogOpen(open)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <BookmarkPlusIcon size={18} />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{msData.session_title} 세션을 템플릿으로 저장</DialogTitle>
          <DialogDescription>{`처치정보, 측정항목 및 시간, 측정간격, 세션 메모를 템플릿으로 저장합니다`}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="template_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    템플릿 이름 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="템플릿 이름을 입력해주세요"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template_comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="템플릿 설명을 입력해주세요"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" tabIndex={-1}>
                  닫기
                </Button>
              </DialogClose>

              <SubmitButton isPending={isSubmitting} buttonText={'저장'} />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

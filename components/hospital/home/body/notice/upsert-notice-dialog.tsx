'use client'
'use no memo'

import DeleteNoticeButton from '@/components/hospital/home/body/notice/delete-notice-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import UserAvatar from '@/components/hospital/common/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NOTICE_COLORS } from '@/constants/hospital/icu/chart/colors'
import { noticeSchema } from '@/lib/schemas/hospital-home/hospital-home-schemas'
import { createNotice, updateNotice } from '@/lib/services/hospital-home/notice'
import { cn } from '@/lib/utils/utils'
import type { NoticeColorType } from '@/types/hospital/notice'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarIcon,
  Check,
  EditIcon,
  LoaderCircleIcon,
  PlusIcon,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { HospitalMetadata } from '../todo/todo'

type UpsertNoticeDialogProps = {
  hosId: string
  loggedInUserId: string
  isEdit?: boolean
  oldNoticeId?: string
  oldNoticeText?: string
  oldNoticeColor?: NoticeColorType
  oldStartDate?: Date | null
  oldEndDate?: Date | null
  oldIsDone?: boolean
  oldTargetUser?: string | null
  metadata: HospitalMetadata
  onSubmitSuccess?: () => void
}

export default function UpsertNoticeDialog({
  hosId,
  loggedInUserId,
  isEdit,
  oldNoticeText,
  oldNoticeColor,
  oldNoticeId,
  oldStartDate,
  oldEndDate,
  oldIsDone,
  oldTargetUser,
  metadata,
  onSubmitSuccess,
}: UpsertNoticeDialogProps) {
  const { refresh } = useRouter()

  const form = useForm<z.infer<typeof noticeSchema>>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      notice: oldNoticeText ?? '',
      color: oldNoticeColor ?? '#fef08a',
      start_date: oldStartDate ?? new Date(),
      end_date: oldEndDate ?? null,
      target_user: oldTargetUser ?? '',
      is_done: oldIsDone ?? false,
    },
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStartPopoverOpen, setIsStartPopoverOpen] = useState(false)
  const [isEndPopoverOpen, setIsEndPopoverOpen] = useState(false)
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const selectedUsers = useMemo(() => {
    const value = form.watch('target_user') || ''
    return value ? value.split(',').filter(Boolean) : []
  }, [form.watch('target_user')])

  const options = useMemo(() => {
    if (!metadata) return []
    const groups = metadata.groups.map((g) => ({
      label: g,
      value: g,
      type: 'group',
    }))
    const users = metadata.users.map((u) => ({
      label: u.name,
      value: u.user_id,
      type: 'user',
      avatar_url: u.avatar_url,
    }))
    return [...groups, ...users]
  }, [metadata])

  const handleUpsertNotice = async (values: z.infer<typeof noticeSchema>) => {
    const { color, notice, start_date, end_date, target_user, is_done } = values
    setIsSubmitting(true)

    isEdit
      ? await updateNotice(
          oldNoticeId!,
          notice,
          color,
          start_date,
          end_date,
          target_user,
          is_done,
        )
      : await createNotice(
          notice,
          color,
          hosId,
          loggedInUserId,
          start_date,
          end_date,
          target_user,
        )

    toast.success(
      isEdit ? '공지사항을 수정하였습니다' : '공지사항을 추가하였습니다',
    )

    if (onSubmitSuccess) {
      onSubmitSuccess()
    } else {
      refresh()
    }

    setIsDialogOpen(false)
    setIsSubmitting(false)
  }
  
  const getValueLabel = (val: string) => {
    const found = options.find((o) => o.value === val)
    return found ? found.label : val
  }

  const toggleUser = (user: string) => {
    const current = selectedUsers
    let next
    if (current.includes(user)) {
      next = current.filter((u) => u !== user)
    } else {
      next = [...current, user]
    }
    form.setValue('target_user', next.join(','))
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      form.reset({
        notice: oldNoticeText ?? '',
        color: oldNoticeColor ?? '#fef08a',
        start_date: oldStartDate ?? new Date(),
        end_date: oldEndDate ?? null,
        target_user: oldTargetUser ?? '',
        is_done: oldIsDone ?? false,
      })
    }
    setIsDialogOpen(open)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="icon" className="h-6 w-6" variant="ghost">
            <EditIcon
              style={{
                width: '14px',
                height: '14px',
              }}
            />
          </Button>
        ) : (
          <Button variant="default" size="icon">
            <PlusIcon size={14} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '공지사항 수정' : '공지사항 추가'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? '공지사항을 수정해주세요'
              : '새로운 공지사항을 추가해주세요'}{' '}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpsertNotice)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">
                      노출 시작일 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover
                      open={isStartPopoverOpen}
                      onOpenChange={setIsStartPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'h-8 pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'yyyy-MM-dd')
                            ) : (
                              <span className="text-xs">날짜 선택</span>
                            )}
                            <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          initialFocus
                          locale={ko}
                          fixedWeeks
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setIsStartPopoverOpen(false)
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">노출 종료일</FormLabel>
                    <Popover
                      open={isEndPopoverOpen}
                      onOpenChange={setIsEndPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'h-8 pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'yyyy-MM-dd')
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                미선택 시 무기한
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          initialFocus
                          locale={ko}
                          fixedWeeks
                          selected={field.value ?? undefined}
                          onSelect={(date) => {
                            field.onChange(date)
                            setIsEndPopoverOpen(false)
                          }}
                          captionLayout="dropdown"
                        />
                        {field.value && (
                          <div className="border-t p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                field.onChange(null)
                                setIsEndPopoverOpen(false)
                              }}
                            >
                              날짜 선택 해제 (무기한)
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="target_user"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs">대상자 (미지정 시 전체)</FormLabel>
                  <Popover
                    open={isUserSelectOpen}
                    onOpenChange={setIsUserSelectOpen}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="flex min-h-[32px] cursor-pointer flex-wrap gap-1 rounded-md border p-1 transition-colors hover:border-primary">
                          {selectedUsers.length > 0 ? (
                            selectedUsers.map((user) => (
                              <Badge
                                key={user}
                                variant="secondary"
                                className="flex items-center gap-1 px-1 py-0"
                              >
                                {getValueLabel(user)}
                                <X
                                  className="h-2 w-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleUser(user)
                                  }}
                                />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              대상자 선택 (복수 선택 가능, 미지정은 전체로 설정)
                            </span>
                          )}
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 max-h-[350px] overflow-auto" align="start">
                      <Command className="h-full max-h-[300px]">
                        <CommandInput
                          placeholder="담당자 또는 그룹 검색..."
                          value={inputValue}
                          onValueChange={setInputValue}
                          className="h-8"
                        />
                        <CommandList 
                          className="max-h-[300px] overflow-y-auto scrollbar-thin"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          <CommandEmpty className="p-2 text-xs">
                             <Button 
                              variant="ghost" 
                              className="w-full justify-start text-xs h-8"
                              onClick={() => {
                                if (inputValue && !selectedUsers.includes(inputValue)) {
                                  toggleUser(inputValue)
                                  setInputValue('')
                                }
                              }}
                            >
                              <PlusIcon className="mr-2 h-3 w-3" />
                              &quot;{inputValue}&quot; 직접 추가하기
                            </Button>
                          </CommandEmpty>
                          <CommandGroup heading="그룹">
                            {options
                              .filter((o) => o.type === 'group')
                              .map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  onSelect={() => toggleUser(opt.value)}
                                  className="text-xs"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-3 w-3',
                                      selectedUsers.includes(opt.value)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {opt.label}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                          <CommandGroup heading="담당자">
                            {options
                              .filter((o) => o.type === 'user')
                              .map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  onSelect={() => toggleUser(opt.value)}
                                  className="text-xs"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-3 w-3',
                                      selectedUsers.includes(opt.value)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full font-bold">
                                      <UserAvatar
                                        src={(opt as any).avatar_url!}
                                        alt={opt.label}
                                      />
                                    </div>
                                    {opt.label}
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">내용 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="h-24 text-sm"
                      autoComplete="off"
                      placeholder="공지 내용을 입력해주세요"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex items-end justify-between">
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">배경 색상</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              'h-8 w-24',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NOTICE_COLORS.map((color) => (
                            <SelectItem value={color} key={color}>
                              <div
                                style={{ backgroundColor: color }}
                                className="h-4 w-4 rounded-full border"
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_done"
                  render={({ field }) => (
                    <FormItem className="flex h-8 flex-row items-center space-x-2 space-y-0 rounded-md border px-2.5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-medium">
                        완료됨
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                {isEdit && (
                  <DeleteNoticeButton
                    noticeId={oldNoticeId!}
                    setIsDialogOpen={setIsDialogOpen}
                    onDeleteSuccess={onSubmitSuccess}
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isEdit ? '수정' : '등록'}
                  {isSubmitting && (
                    <LoaderCircleIcon className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

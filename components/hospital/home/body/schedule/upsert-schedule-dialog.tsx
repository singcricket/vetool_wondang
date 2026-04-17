'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarIcon,
  Check,
  EditIcon,
  LoaderCircleIcon,
  PlusIcon,
  X,
  MapPin,
  Clock,
  Type,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { cn } from '@/lib/utils/utils'
import { scheduleSchema } from '@/lib/schemas/hospital-home/schedule-schema'
import { upsertSchedule } from '@/lib/services/hospital-home/schedule'
import {
  fetchScheduleSetting,
  fetchHospitalMetadata,
} from '@/lib/services/hospital-home/todo'
import { HospitalMetadata } from '../todo/todo'
import { Schedule } from '@/types/hospital/schedule'
import {
  ScheduleSetting,
  ScheduleCategory,
} from '@/types/hospital'

type Props = {
  hosId: string
  date?: Date
  isEdit?: boolean
  refetch: () => Promise<void>
  schedule?: Schedule
  metadata?: HospitalMetadata
  isAdmin?: boolean
}

export default function UpsertScheduleDialog({
  hosId,
  date = new Date(),
  isEdit,
  refetch,
  schedule,
  metadata,
  isAdmin = false,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [scheduleSetting, setScheduleSetting] =
    useState<ScheduleSetting | null>(null)

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: schedule?.title ?? '',
      content: schedule?.content ?? '',
      location: schedule?.location ?? '',
      is_all_day: schedule?.is_all_day ?? false,
      start_time: schedule ? new Date(schedule.start_time) : date,
      end_time: schedule ? new Date(schedule.end_time) : date,
      target_users: schedule?.target_users.join(',') ?? '',
      color: schedule?.color ?? '#3b82f6',
      category: schedule?.category ?? '일반',
      is_admin_only: schedule?.target_users.includes('admin') ?? false,
    },
  })

  const selectedUsers = useMemo(() => {
    const value = form.watch('target_users') || ''
    return value ? value.split(',').filter(Boolean) : []
  }, [form.watch('target_users')])

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
    }))
    return [...groups, ...users]
  }, [metadata])

  const getValueLabel = (val: string) => {
    const found = options.find((o) => o.value === val)
    return found ? found.label : val
  }

  useEffect(() => {
    if (isDialogOpen) {
      const load = async () => {
        try {
          const setting = await fetchScheduleSetting(hosId)
          setScheduleSetting(setting)
        } catch (error) {
          console.error('Failed to load schedule setting:', error)
        }
      }
      load()
    }
  }, [isDialogOpen, hosId])

  // 카테고리 선택 시 기본 시간 자동 입력 로직
  const categoryValue = form.watch('category')
  useEffect(() => {
    if (!scheduleSetting || !categoryValue) return

    // 수정 모드이고 초기 진입 시(카테고리가 기존과 같은 경우)에는 자동 입력 방지
    if (isEdit && categoryValue === schedule?.category) return

    const allCategories = [
      ...(scheduleSetting.schedule_categories || []),
      ...(scheduleSetting.hidden_categories || []),
    ]

    const selectedCategory = allCategories.find((c) => c.name === categoryValue)

    if (
      selectedCategory &&
      selectedCategory.start_time &&
      selectedCategory.end_time
    ) {
      const [sH, sM] = selectedCategory.start_time.split(':').map(Number)
      const [eH, eM] = selectedCategory.end_time.split(':').map(Number)

      const currentStart = new Date(form.getValues('start_time'))
      const currentEnd = new Date(form.getValues('end_time'))

      currentStart.setHours(sH, sM, 0, 0)
      currentEnd.setHours(eH, eM, 0, 0)

      form.setValue('start_time', currentStart)
      form.setValue('end_time', currentEnd)
      
      // 종일 일정이 해제되도록 처리 (시간이 지정되어 있으므로)
      form.setValue('is_all_day', false)
    }
  }, [categoryValue, scheduleSetting, form, isEdit, schedule?.category])

  const handleUpsertSchedule = async (
    values: z.infer<typeof scheduleSchema>,
  ) => {
    setIsSubmitting(true)
    try {
      const { start_time, end_time, target_users, ...rest } = values

      // 카테고리별 컬러 적용
      let selectedColor = rest.color
      const allCategories = [
        ...(scheduleSetting?.schedule_categories || []),
        ...(scheduleSetting?.hidden_categories || []),
      ]
      
      const cat = allCategories.find((c) => c.name === rest.category)
      if (cat) selectedColor = cat.color

      await upsertSchedule({
        ...rest,
        id: schedule?.id,
        hos_id: hosId,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
        target_users: (() => {
          const users = target_users ? target_users.split(',').filter(u => Boolean(u) && u !== 'admin') : []
          if (values.is_admin_only) {
            users.push('admin')
          }
          return users
        })(),
        created_by: null,
        content: rest.content ?? null,
        location: rest.location ?? null,
        color: selectedColor ?? null,
        category: rest.category ?? null,
      })

      toast.success(`스케줄을 ${isEdit ? '수정' : '저장'}하였습니다`)
      setIsDialogOpen(false)
      await refetch()
    } catch (error) {
      console.error(error)
      toast.error('저장에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUser = (user: string) => {
    const current = selectedUsers
    let next
    if (current.includes(user)) {
      next = current.filter((u) => u !== user)
    } else {
      next = [...current, user]
    }
    form.setValue('target_users', next.join(','))
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="icon" className="h-6 w-6" variant="ghost">
            <EditIcon className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="default" size="icon">
            <PlusIcon size={14} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>스케줄 {isEdit ? '수정' : '추가'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '스케줄을 수정해주세요' : '새로운 스케줄을 추가해주세요'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpsertSchedule)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* 카테고리 */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Tag className="h-3 w-3" /> 카테고리
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? '일반'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="일반">일반</SelectItem>
                        
                        {(scheduleSetting?.schedule_categories?.length || 0) > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-50/50 uppercase tracking-wider mt-1 mb-0.5">
                              Standard
                            </div>
                            {scheduleSetting?.schedule_categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}

                        {isAdmin && (scheduleSetting?.hidden_categories?.length || 0) > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-bold text-amber-500 bg-amber-50/50 uppercase tracking-wider mt-2 mb-0.5">
                              Admin (Hidden)
                            </div>
                            {scheduleSetting?.hidden_categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제목 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Type className="h-3 w-3" /> 제목{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="오전 회의, 수술 등" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 날짜 선택 */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> 날짜
                    </FormLabel>
                    <Popover
                      open={isPopoverOpen}
                      onOpenChange={setIsPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'yyyy-MM-dd')
                            ) : (
                              <span>날짜 선택</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          initialFocus
                          locale={ko}
                          selected={field.value}
                          onSelect={(newDate) => {
                            if (!newDate) return
                            // 기존 시간 유지하며 날짜만 변경
                            const updated = new Date(field.value)
                            updated.setFullYear(
                              newDate.getFullYear(),
                              newDate.getMonth(),
                              newDate.getDate(),
                            )
                            field.onChange(updated)

                            // 종료 날짜도 동일하게 변경 (시작 날짜 기준으로 기본값 세팅)
                            const currentEnd = new Date(
                              form.getValues('end_time'),
                            )
                            currentEnd.setFullYear(
                              newDate.getFullYear(),
                              newDate.getMonth(),
                              newDate.getDate(),
                            )
                            form.setValue('end_time', currentEnd)

                            setIsPopoverOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 종일 여부 */}
              <FormField
                control={form.control}
                name="is_all_day"
                render={({ field }) => (
                  <FormItem className="flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="pb-1">하루 종일</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* 관리 전용 (어드민만 보임) */}
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="is_admin_only"
                  render={({ field }) => (
                    <FormItem className="flex items-end pb-2">
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="pb-1 text-amber-600 font-semibold cursor-pointer">
                          관리 전용
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!form.watch('is_all_day') && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 시작 시간
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={format(field.value, 'HH:mm')}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(':')
                              const updated = new Date(field.value)
                              updated.setHours(parseInt(h), parseInt(m))
                              field.onChange(updated)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 종료 시간
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            value={format(field.value, 'HH:mm')}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(':')
                              const updated = new Date(field.value)
                              updated.setHours(parseInt(h), parseInt(m))
                              field.onChange(updated)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* 대상자 */}
            <FormField
              control={form.control}
              name="target_users"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>대상자</FormLabel>
                  <Popover
                    open={isUserSelectOpen}
                    onOpenChange={setIsUserSelectOpen}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px] cursor-pointer hover:border-primary transition-colors">
                          {selectedUsers.length > 0 ? (
                            selectedUsers.map((user) => (
                              <Badge
                                key={user}
                                variant="secondary"
                                className="flex items-center gap-1 py-0.5"
                              >
                                {getValueLabel(user)}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleUser(user)
                                  }}
                                />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              대상자 선택 (복수 선택 가능, 미지정은 전체로 설정)
                            </span>
                          )}
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[400px] p-0 max-h-[350px] overflow-auto"
                      align="start"
                    >
                      <Command className="h-full max-h-[300px]">
                        <CommandInput
                          placeholder="담당자 또는 그룹 검색..."
                          value={inputValue}
                          onValueChange={setInputValue}
                        />
                        <CommandList
                          className="max-h-[300px] overflow-y-auto scrollbar-thin"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs h-8"
                              onClick={() => {
                                if (
                                  inputValue &&
                                  !selectedUsers.includes(inputValue)
                                ) {
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
                                  className="text-sm"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
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
                                  className="text-sm"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedUsers.includes(opt.value)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {opt.label}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 장소 */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> 장소
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="제1진료실, 대회의실 등" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 내용 */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="추가적인 설명이 필요하다면 작성해주세요"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  취소
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? '수정하기' : '저장하기'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

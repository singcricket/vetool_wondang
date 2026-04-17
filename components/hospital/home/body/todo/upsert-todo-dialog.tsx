'use no memo'

import DeleteTodoDialog from '@/components/hospital/home/body/todo/delete-todo-dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { todoSchema } from '@/lib/schemas/hospital-home/hospital-home-schemas'
import { upsertTodo } from '@/lib/services/hospital-home/todo'
import { cn, formatDateToISOString } from '@/lib/utils/utils'
import type { ClientTodo } from '@/types/hospital/todo'
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
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { HospitalMetadata } from './todo'

type Props = {
  hosId: string
  loggedInUserId: string
  date: Date
  isEdit?: boolean
  refetch: () => Promise<void>
  todo?: ClientTodo
  metadata?: HospitalMetadata
}

export default function UpsertTodoDialog({
  hosId,
  loggedInUserId,
  date,
  isEdit,
  refetch,
  todo,
  metadata,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const form = useForm<z.infer<typeof todoSchema>>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      todo_title: todo?.todo_title ?? '',
      target_user: todo?.target_user ?? '',
      target_date: date,
    },
  })

  const selectedUsers = useMemo(() => {
    const value = form.watch('target_user') || ''
    return value ? value.split(',').filter(Boolean) : []
  }, [form.watch('target_user')])

  const options = useMemo(() => {
    if (!metadata) return []
    const groups = metadata.groups.map(g => ({ label: g, value: g, type: 'group' }))
    const users = metadata.users.map(u => ({ label: u.name, value: u.user_id, type: 'user' }))
    return [...groups, ...users]
  }, [metadata])

  const getValueLabel = (val: string) => {
    const found = options.find((o) => o.value === val)
    return found ? found.label : val
  }

  const handleUpsertTodo = async (values: z.infer<typeof todoSchema>) => {
    const { todo_title, target_user, target_date } = values
    setIsSubmitting(true)

    await upsertTodo(
      todo_title,
      target_user,
      formatDateToISOString(target_date),
      hosId,
      loggedInUserId,
      todo?.id,
    )

    toast.success('TODO를 저장하였습니다')

    setIsDialogOpen(false)
    setIsSubmitting(false)

    await refetch()
  }

  const toggleUser = (user: string) => {
    const current = selectedUsers
    let next
    if (current.includes(user)) {
      next = current.filter(u => u !== user)
    } else {
      next = [...current, user]
    }
    form.setValue('target_user', next.join(','))
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      form.reset({
        todo_title: todo?.todo_title ?? '',
        target_user: todo?.target_user ?? '',
        target_date: date,
      })
    }
    setIsDialogOpen(open)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
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
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>TODO {isEdit ? '수정' : '추가'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'TODO를 수정해주세요' : '새로운 TODO를 추가해주세요'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpsertTodo)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    날짜 <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
                            <span>Pick a date</span>
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
                        fixedWeeks
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setIsPopoverOpen(false)
                        }}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_user"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>담당자</FormLabel>
                  <Popover open={isUserSelectOpen} onOpenChange={setIsUserSelectOpen} modal={false}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px] cursor-pointer hover:border-primary transition-colors">
                          {selectedUsers.length > 0 ? (
                            selectedUsers.map((user) => (
                              <Badge key={user} variant="secondary" className="flex items-center gap-1 py-0.5">
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
                            <span className="text-sm text-muted-foreground">담당자 선택 (복수 선택 가능, 미지정은 전체로 설정)</span>
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
                             {options.filter(o => o.type === 'group').map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  onSelect={() => toggleUser(opt.value)}
                                  className="text-sm"
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedUsers.includes(opt.value) ? "opacity-100" : "opacity-0")} />
                                  {opt.label}
                                </CommandItem>
                             ))}
                          </CommandGroup>
                          <CommandGroup heading="담당자">
                             {options.filter(o => o.type === 'user').map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  onSelect={() => toggleUser(opt.value)}
                                  className="text-sm"
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedUsers.includes(opt.value) ? "opacity-100" : "opacity-0")} />
                                  {opt.label}
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
              name="todo_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    TODO <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      {...field}
                      value={field.value ?? ''}
                      className="text-sm"
                      autoComplete="off"
                      placeholder="검체수거"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              {isEdit && (
                <DeleteTodoDialog
                  todoId={todo!.id}
                  setIsDialogOpen={setIsDialogOpen}
                  refetch={refetch}
                />
              )}

              <div className="ml-auto">
                <DialogClose asChild>
                  <Button variant="outline" tabIndex={-1}>
                    닫기
                  </Button>
                </DialogClose>
                <Button type="submit" className="ml-2" disabled={isSubmitting}>
                  저장
                  <LoaderCircleIcon
                    className={cn(
                      isSubmitting ? 'ml-2 animate-spin' : 'hidden',
                    )}
                  />
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

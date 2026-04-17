import { Checkbox } from '@/components/ui/checkbox'
import { toggleIsDone } from '@/lib/services/hospital-home/todo'
import type { ClientTodo } from '@/types/hospital/todo'
import { useEffect, useState } from 'react'
import UpsertTodoDialog from './upsert-todo-dialog'
import { HospitalMetadata } from './todo'
import { cn } from '@/lib/utils/utils'

type Props = {
  todo: ClientTodo
  hosId: string
  loggedInUserId: string
  date: Date
  refetch: () => Promise<void>
  metadata: HospitalMetadata
}

export default function SingleTodo({
  todo,
  hosId,
  loggedInUserId,
  date,
  refetch,
  metadata,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChecked, setIsChecked] = useState(todo.is_done)

  useEffect(() => {
    setTimeout(() => setIsChecked(todo.is_done), 0)
  }, [todo.is_done])

  const handleIsDone = async () => {
    setIsUpdating(true)

    setIsChecked((prev) => !prev)

    await toggleIsDone(todo.id, todo.is_done)
    await refetch()

    setIsUpdating(false)
  }

  return (
    <li className="flex justify-between gap-2 py-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <Checkbox
          id={todo.id}
          disabled={isUpdating}
          checked={isChecked}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={handleIsDone}
        />
        <label
          htmlFor={todo.id}
          className={cn(
            "cursor-pointer transition hover:underline text-sm leading-relaxed whitespace-pre-wrap break-all",
            isChecked && "text-muted-foreground line-through"
          )}
        >
          {todo.todo_title}
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start pt-0.5">
        <span className="text-[11px] text-muted-foreground max-w-[80px] truncate bg-accent/50 px-1.5 py-0.5 rounded-sm">
          {(todo.target_user || '')
            .split(',')
            .filter(Boolean)
            .map((t) => metadata.users.find((u) => u.user_id === t)?.name || t)
            .join(', ')}
        </span>

        <UpsertTodoDialog
          todo={todo}
          date={date}
          hosId={hosId}
          loggedInUserId={loggedInUserId}
          refetch={refetch}
          isEdit
          metadata={metadata}
        />
      </div>
    </li>
  )
}

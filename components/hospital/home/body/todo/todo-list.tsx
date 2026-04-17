import FormattedMonoDate from '@/components/common/formatted-mono-date'
import NoResultSquirrel from '@/components/common/no-result-squirrel'
import SingleTodo from '@/components/hospital/home/body/todo/single-todo'

import type { ClientTodo } from '@/types/hospital/todo'
import { HospitalMetadata } from './todo'

type Props = {
  date: Date
  hosId: string
  loggedInUserId: string
  todos: ClientTodo[]
  refetch: () => Promise<void>
  activeFilter: 'all' | 'done' | 'not-done'
  metadata: HospitalMetadata
}

export default function TodoList({
  date,
  hosId,
  loggedInUserId,
  todos,
  refetch,
  activeFilter,
  metadata,
}: Props) {
  const filteredTodos = todos.filter((todo) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'done') return todo.is_done
    if (activeFilter === 'not-done') return !todo.is_done
    return true
  })

  return (
    <>
      <FormattedMonoDate date={date} />

      {filteredTodos.length === 0 ? (
        <NoResultSquirrel
          text="TODO가 없습니다"
          size="sm"
          className="flex-col pb-2"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200">
          {filteredTodos.map((todo) => (
            <SingleTodo
              key={todo.id}
              todo={todo}
              hosId={hosId}
              loggedInUserId={loggedInUserId}
              date={date}
              refetch={refetch}
              metadata={metadata}
            />
          ))}
        </ul>
      )}
    </>
  )
}

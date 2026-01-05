import FormattedMonoDate from '@/components/common/formatted-mono-date'
import { formatTimeDifference } from '@/lib/utils/utils'
import { format } from 'date-fns'
import { ChangeEvent } from 'react'

type Props = {
  isEditMode: boolean
  setEditedCreateTimestamp: React.Dispatch<React.SetStateAction<string>>
  editTimestamp: string | null
  editedCreateTimestamp: string
}

export default function MemoTimeStamp({
  isEditMode,
  setEditedCreateTimestamp,
  editTimestamp,
  editedCreateTimestamp,
}: Props) {
  const handleChageTimeStamp = (e: ChangeEvent<HTMLInputElement>) => {
    setEditedCreateTimestamp(e.target.value)
  }

  return (
    <div className="flex gap-1 text-xs text-muted-foreground">
      {isEditMode ? (
        <input
          type="datetime-local"
          className="bg-transparent"
          value={format(new Date(editedCreateTimestamp!), "yyyy-MM-dd'T'HH:mm")}
          onChange={handleChageTimeStamp}
        />
      ) : (
        <div className="flex items-center gap-2">
          <FormattedMonoDate date={editedCreateTimestamp} withTime />
          {editTimestamp && (
            <span suppressHydrationWarning>
              ({formatTimeDifference(editTimestamp)} 수정됨)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

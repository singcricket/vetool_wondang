import FormattedMonoDate from '@/components/common/formatted-mono-date'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { formatTimeDifference } from '@/lib/utils/utils'
import { format } from 'date-fns'
import { ChangeEvent } from 'react'

type Props = {
  isEditMode: boolean
  setEditedCreateTimestamp: React.Dispatch<React.SetStateAction<string>>
  editTimestamp: string | null
  editedCreateTimestamp: string
  msData : MsWithPatientWithWeight
}

export default function MsMemoTimeStamp({
  isEditMode,
  setEditedCreateTimestamp,
  editTimestamp,
  editedCreateTimestamp,
  msData
}: Props) {
  const handleChageTimeStamp = (e: ChangeEvent<HTMLInputElement>) => {
    setEditedCreateTimestamp(e.target.value)
  }

  const getDiffLabel = () => {
    if (!msData.start_time) return '시작전'
    if (!editedCreateTimestamp) return ''

    const start = new Date(msData.start_time).getTime()
    const current = new Date(editedCreateTimestamp).getTime()
    
    if (isNaN(start) || isNaN(current)) return ''

    const diffInMinutes = Math.floor((current - start) / (1000 * 60))

    if (diffInMinutes < 0) {
      return `시작 ${diffInMinutes}분`
    }
    
    return `시작 +${diffInMinutes}분`
  }

  const diffLabel = getDiffLabel()

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
          {diffLabel && (
            <span suppressHydrationWarning>
              ({diffLabel})
            </span>
          )}
        </div>
      )}
    </div>
  )
}

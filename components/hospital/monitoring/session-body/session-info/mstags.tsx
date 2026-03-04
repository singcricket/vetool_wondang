'use client'

import Autocomplete from '@/components/common/auto-complete/auto-complete'
import { updateMsTag } from '@/lib/services/monitoring/update-ms'
// import { updateClTag } from '@/lib/services/checklist/update-checklist'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  sessionId: string
  msTag: string
}

export default function MsTag({ msTag, sessionId }: Props) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateChiefComplaint = async (value: string) => {
    const trimmedValue = value.trim()

    if (msTag === trimmedValue) {
      return
    }

    setIsUpdating(true)

    await updateMsTag(sessionId, trimmedValue)


    toast.success('태그를 변경하였습니다')

    setIsUpdating(false)
  }

  return (
    <Autocomplete
      label="태그"
      defaultValue={msTag}
      handleUpdate={handleUpdateChiefComplaint}
      isUpdating={isUpdating}
    />
  )
}

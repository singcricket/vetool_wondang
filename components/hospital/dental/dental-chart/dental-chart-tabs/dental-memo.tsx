'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { updateDentalChart } from '@/lib/actions/dental/update-dental-chart'

type Props = {
  chartId: string
  hosId: string
  memo: string | null
}

export default function DentalMemo({ chartId, hosId, memo }: Props) {
  const { refresh } = useRouter()
  const [value, setValue] = useState(memo ?? '')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setValue(memo ?? '')
  }, [memo])

  const handleBlur = async () => {
    if (value === (memo ?? '')) return
    
    setIsUpdating(true)
    try {
      await updateDentalChart(chartId, hosId, {
        general_note: value || null
      })
      toast.success('메모를 저장하였습니다')
      refresh()
    } catch (error) {
      console.error(error)
      toast.error('메모 저장에 실패하였습니다')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">일반 메모</span>
        {isUpdating && <span className="text-[10px] text-primary animate-pulse italic">저장 중...</span>}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={6}
        className="resize-none text-sm focus-visible:ring-1"
        placeholder="차트 전반에 대한 특이사항이나 메모를 입력하세요."
      />
    </div>
  )
}

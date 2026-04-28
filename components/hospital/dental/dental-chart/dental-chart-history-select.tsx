'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { fetchPatientDentalHistory } from '@/lib/services/dental/fetch-dental'
import { History } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type Props = {
  hosId: string
  currentDentalId: string
  patientId: string
}

export default function DentalChartHistorySelect({ hosId, currentDentalId, patientId }: Props) {
  const router = useRouter()
  const [history, setHistory] = useState<{ id: string; chart_date: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await fetchPatientDentalHistory(patientId)
        setHistory(data)
      } catch (error) {
        console.error('Failed to load dental history:', error)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [patientId])

  const handleValueChange = (dentalId: string) => {
    const selected = history.find(h => h.id === dentalId)
    if (selected) {
      router.push(`/hospital/${hosId}/dental/${selected.chart_date}/${selected.id}`)
    }
  }

  if (loading || history.length <= 1) return null

  return (
    <Select value={currentDentalId} onValueChange={handleValueChange}>
      <SelectTrigger className="h-8 w-[180px] bg-white/50 backdrop-blur-sm border-slate-200">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <History className="h-3.5 w-3.5 text-slate-400" />
          <SelectValue placeholder="과거 차트 이동" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {history.map((item) => (
          <SelectItem key={item.id} value={item.id} className="text-xs">
            {format(new Date(item.chart_date), 'yyyy년 MM월 dd일', { locale: ko })}
            {item.id === currentDentalId && ' (현재)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

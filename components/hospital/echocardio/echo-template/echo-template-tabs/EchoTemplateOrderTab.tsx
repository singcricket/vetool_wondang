'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { GripVertical } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'
import { cn } from '@/lib/utils/utils'

interface EchoTemplateOrderTabProps {
  sortedFlatItems: any[]
  setFlatOrder: (order: string[]) => void
  isPending: boolean
  onSubmit: () => void
  speciesColor: 'blue' | 'orange'
}

export default function EchoTemplateOrderTab({
  sortedFlatItems,
  setFlatOrder,
  isPending,
  onSubmit,
  speciesColor,
}: EchoTemplateOrderTabProps) {
  const gripColor = speciesColor === 'blue' ? 'hover:text-blue-600' : 'hover:text-orange-600'
  const buttonColor = speciesColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'

  return (
    <div className="flex flex-1 flex-col gap-2 min-h-0">
      <p className="text-xs text-muted-foreground">
        항목을 드래그하여 목록 모드에서 표시될 순서를 지정합니다
      </p>
      <div className="flex flex-1 flex-col overflow-hidden rounded border bg-white min-h-0">
        <ReactSortable
          list={sortedFlatItems.map((item: any) => ({ ...item, id: item.keywordID }))}
          setList={(newList) => setFlatOrder(newList.map((item) => item.id))}
          animation={200}
          handle=".drag-handle"
          className="flex flex-1 flex-col overflow-y-auto"
        >
          {sortedFlatItems.map((item: any, index: number) => (
            <div key={item.keywordID} className="flex items-center gap-2 border-b px-3 py-1.5 last:border-b-0 hover:bg-slate-50 transition-colors">
              <GripVertical className={cn("drag-handle h-3 w-3 cursor-grab text-muted-foreground active:cursor-grabbing", gripColor)} />
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
              <span className="flex-1 text-sm">{item.keywordName}</span>
              <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">{item.section}</span>
            </div>
          ))}
        </ReactSortable>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => setFlatOrder([])}>
          순서 초기화
        </Button>
        <Button 
          size="sm" 
          onClick={onSubmit} 
          disabled={isPending} 
          className={cn("text-white", buttonColor)}
        >
          {isPending ? <Spinner className="text-white" /> : '순서 저장'}
        </Button>
      </div>
    </div>
  )
}

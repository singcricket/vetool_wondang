'use client'

import { useState } from 'react'
import { FileText, Activity, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import NotesViewDialog from '@/components/hospital/notes/notes-body/notes-list/notes-view-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import MsReportContent from '@/components/hospital/monitoring/session-header/ms-report/ms-report-content'

interface Props {
  item: any
  resourceData: any
  hosId: string
}

export default function CollectionItemRow({ item, resourceData, hosId }: Props) {
  const [isReportOpen, setIsReportOpen] = useState(false)

  const isNote = item.resource_type === 'note'
  const displayTitle = resourceData?.title || (isNote ? '제목 없는 진료 기록' : '제목 없는 모니터링 세션')

  // Common inner content for the row
  const rowContent = (
    <div className="flex flex-1 items-center gap-4 p-5 px-0 min-w-0 cursor-pointer">
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
        isNote ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
      )}>
        {isNote ? <FileText size={20} /> : <Activity size={20} />}
      </div>
      <div className="flex flex-col flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isNote ? '진료 노트' : '모니터링'}
          </span>
          <span className="text-[10px] font-mono text-slate-300">#{item.resource_id.slice(0, 8)}</span>
        </div>
        <span className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
          {displayTitle}
          <span className="ml-2 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-normal">상세보기</span>
        </span>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-4 p-0 px-8 hover:bg-slate-50 transition-colors border-b last:border-0 group">
      <GripVertical size={20} className="text-slate-200 cursor-grab" />
      
      {isNote ? (
        <NotesViewDialog note={resourceData}>
          {rowContent}
        </NotesViewDialog>
      ) : (
        <>
          <div className="flex-1" onClick={() => setIsReportOpen(true)}>
            {rowContent}
          </div>
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 rounded-[40px]">
              <div className="p-6 h-full overflow-y-auto bg-white">
                <MsReportContent 
                  msData={resourceData} 
                  isSharedView={false} 
                  onClose={() => setIsReportOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  )
}

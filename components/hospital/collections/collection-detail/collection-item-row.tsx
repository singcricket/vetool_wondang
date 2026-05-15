'use client'

import { useState } from 'react'
import { FileText, Activity, GripVertical, Heart, MinusCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import NotesViewDialog from '@/components/hospital/notes/notes-body/notes-list/notes-view-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import MsReportContent from '@/components/hospital/monitoring/session-header/ms-report/ms-report-content'
import { MonitoringHosDataProvider } from '@/providers/monitoring-hos-data-context-provider'
import { removeCollectionItem } from '@/lib/services/collections/collections'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SharedOwnerTabsClient from '@/app/shared/[share_id]/_components/shared-owner-tabs-client'
import { fetchOncologyCaseDetail } from '@/lib/services/oncology/fetch-oncology-case'
import type { OncologyCaseFullDetail } from '@/lib/services/oncology/fetch-oncology-case'

interface Props {
  item: any
  resourceData: any
  hosId: string
  msContextData: any
}

export default function CollectionItemRow({ item, resourceData, hosId, msContextData }: Props) {
  const router = useRouter()
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [ownerDetail, setOwnerDetail] = useState<OncologyCaseFullDetail | null>(null)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [ownerOpen, setOwnerOpen] = useState(false)

  const isNote = item.resource_type === 'note'
  const isOncology = item.resource_type === 'oncology_owner'
  const displayTitle = isOncology
    ? (resourceData ? `${resourceData.patient_name} — ${resourceData.diagnosis_name}` : '항암 보호자 뷰')
    : resourceData?.title || (isNote ? '제목 없는 진료 기록' : '제목 없는 모니터링 세션')

  const handleOpenOncology = async () => {
    setOwnerOpen(true)
    if (ownerDetail) return
    setOwnerLoading(true)
    try {
      const detail = await fetchOncologyCaseDetail(item.resource_id)
      setOwnerDetail(detail)
    } catch {
      toast.error('케이스 정보를 불러오지 못했습니다.')
      setOwnerOpen(false)
    } finally {
      setOwnerLoading(false)
    }
  }

  const handleRemove = async () => {
    if (isRemoving) return
    
    setIsRemoving(true)
    try {
      await removeCollectionItem(item.collection_id, item.resource_type, item.resource_id)
      toast.success('항목이 컬렉션에서 제외되었습니다.')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('제외 처리 중 오류가 발생했습니다.')
    } finally {
      setIsRemoving(false)
    }
  }

  // Handle missing resource data (e.g. deleted note/session)
  if (!resourceData) {
    return (
      <div className="flex items-center gap-4 p-0 px-8 opacity-50 border-b last:border-0 group select-none">
        <GripVertical size={20} className="text-slate-200" />
        <div className="flex flex-1 items-center gap-4 p-5 px-0 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
            {isNote ? <FileText size={20} /> : <Activity size={20} />}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                {isNote ? '진료 노트' : '모니터링'} (삭제됨)
              </span>
            </div>
            <span className="text-sm font-bold text-slate-300 italic truncate">
              데이터를 찾을 수 없습니다. (삭제되었을 수 있습니다)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            <MinusCircle size={18} />
          </Button>
        </div>
      </div>
    )
  }

  // Common inner content for the row
  const rowContent = (
    <div className="flex flex-1 items-center gap-4 p-5 px-0 min-w-0 cursor-pointer">
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
        isNote ? "bg-blue-50 text-blue-600" :
        isOncology ? "bg-indigo-50 text-indigo-600" :
        "bg-emerald-50 text-emerald-600"
      )}>
        {isNote ? <FileText size={20} /> : isOncology ? <Heart size={20} /> : <Activity size={20} />}
      </div>
      <div className="flex flex-col flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isNote ? '진료 노트' : isOncology ? '항암 보호자 뷰' : '모니터링'}
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

      {isOncology ? (
        <>
          <div className="flex-1" onClick={handleOpenOncology}>
            {rowContent}
          </div>
          <Dialog open={ownerOpen} onOpenChange={setOwnerOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 rounded-[40px]">
              <div className="p-6 h-full overflow-y-auto bg-white">
                {ownerLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-slate-300" size={24} />
                  </div>
                )}
                {ownerDetail && <SharedOwnerTabsClient detail={ownerDetail} />}
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : isNote ? (
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
                <MonitoringHosDataProvider msContextData={msContextData}>
                  <MsReportContent
                    msData={resourceData}
                    isSharedView={false}
                    onClose={() => setIsReportOpen(false)}
                  />
                </MonitoringHosDataProvider>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          <MinusCircle size={18} />
        </Button>
      </div>
    </div>
  )
}

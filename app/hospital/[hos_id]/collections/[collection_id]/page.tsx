import { createClient } from '@/lib/supabase/server'
import { Folder, Activity, FileText, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import CollectionHeader from './_components/collection-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CollectionDetailPage(props: { params: Promise<{ hos_id: string; collection_id: string }> }) {
  const params = await props.params;
  const { hos_id, collection_id } = params;
  const supabase = await createClient()

  // 1. Fetch collection metadata
  const { data: collection, error: colError } = await (supabase as any)
    .from('resource_collections')
    .select('*')
    .eq('collection_id', collection_id)
    .single()

  if (colError || !collection) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
        <Folder size={48} className="opacity-10" />
        <p className="font-bold">컬렉션을 찾을 수 없습니다.</p>
        <Link 
          href={`/hospital/${hos_id}/collections`}
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const col = collection as any

  // 2. Fetch items with simple details
  const { data: items, error: itemsError } = await (supabase as any)
    .from('resource_collection_items')
    .select('*')
    .eq('collection_id', collection_id)
    .order('order_index', { ascending: true })

  // 3. Fetch item titles for better display
  const noteIds = items?.filter((i: any) => i.resource_type === 'note').map((i: any) => i.resource_id) || []
  const sessionIds = items?.filter((i: any) => i.resource_type === 'monitoring').map((i: any) => i.resource_id) || []

  const [notesRes, sessionsRes] = await Promise.all([
    noteIds.length > 0 
      ? (supabase as any).from('notes').select('notes_id, title').in('notes_id', noteIds)
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? (supabase as any).from('monitoring_sessions').select('session_id, due_date, patient:patients(name)').in('session_id', sessionIds)
      : Promise.resolve({ data: [] })
  ])

  const notesData = notesRes?.data || []
  const sessionsData = sessionsRes?.data || []

  const itemsMap: Record<string, any> = {
    ...Object.fromEntries(notesData.map((n: any) => [n.notes_id, { title: n.title }])),
    ...Object.fromEntries(sessionsData.map((s: any) => [s.session_id, { title: `모니터링: ${s.patient?.name || '알 수 없음'}`, date: s.due_date }]))
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <CollectionHeader collection={col} hosId={hos_id} />

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">

        <div className="p-4 bg-slate-50 border-b flex items-center justify-between px-8">
          <span className="text-xs font-bold text-slate-400">총 {items?.length || 0}개의 항목</span>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Sorting Enabled</span>
        </div>

        <div className="flex flex-col">
          {items?.length === 0 ? (
            <div className="py-24 text-center text-slate-400 italic text-sm">
              추가된 항목이 없습니다.
            </div>
          ) : (
            items?.map((item: any, idx: number) => {
              const data = itemsMap[item.resource_id]
              const displayTitle = data?.title || (item.resource_type === 'note' ? '제목 없는 진료 기록' : '제목 없는 모니터링 세션')
              const href = item.resource_type === 'note' 
                ? `/hospital/${hos_id}/notes/${item.resource_id}`
                : `/hospital/${hos_id}/monitoring/${data?.date}/monitoring-session/${item.resource_id}/report`

              return (
                <div 
                  key={`${item.resource_type}-${item.resource_id}`}
                  className="flex items-center gap-4 p-0 px-8 hover:bg-slate-50 transition-colors border-b last:border-0 group"
                >
                  <GripVertical size={20} className="text-slate-200 cursor-grab" />
                  <Link 
                    href={href as any}
                    className="flex flex-1 items-center gap-4 p-5 px-0 min-w-0"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                      item.resource_type === 'note' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {item.resource_type === 'note' ? <FileText size={20} /> : <Activity size={20} />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {item.resource_type === 'note' ? '진료 노트' : '모니터링'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300">#{item.resource_id.slice(0, 8)}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                        {displayTitle}
                        <span className="ml-2 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-normal">열람하기 →</span>
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Folder, Activity, FileText, GripVertical, Trash2, ArrowLeft } from 'lucide-react'
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
    return <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
      <Folder size={48} className="opacity-10" />
      <p className="font-bold">컬렉션을 찾을 수 없습니다.</p>
      <Link href={`/hospital/${hos_id}/collections`}>
        <Button variant="outline" size="sm">목록으로 돌아가기</Button>
      </Link>
    </div>
  }

  const col = collection as any

  // 2. Fetch items with simple details
  const { data: items, error: itemsError } = await (supabase as any)
    .from('resource_collection_items')
    .select('*')
    .eq('collection_id', collection_id)
    .order('order_index', { ascending: true })

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-4">
        <Link 
          href={`/hospital/${hos_id}/collections`} 
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          목록으로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{col.title}</h1>
            <p className="text-slate-500 text-sm">{col.description || '컬렉션에 대한 설명이 없습니다.'}</p>
          </div>
          <Button variant="outline" className="font-bold border-2">
            설정 변경
          </Button>
        </div>
      </header>

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
            items?.map((item: any, idx: number) => (
              <div 
                key={`${item.resource_type}-${item.resource_id}`}
                className="flex items-center gap-4 p-5 px-8 hover:bg-slate-50 transition-colors border-b last:border-0 group"
              >
                <GripVertical size={20} className="text-slate-200 cursor-grab" />
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
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {item.resource_type === 'note' ? '진료 기록 항목' : '모니터링 세션 항목'}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

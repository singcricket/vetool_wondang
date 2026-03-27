import { createClient } from '@/lib/supabase/server'
import { Folder } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import CollectionHeader from './_components/collection-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { fetchMsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import CollectionItemRow from './_components/collection-item-row'

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

  // Fetch full details for each resource
  const [notesRes, sessionsData] = await Promise.all([
    noteIds.length > 0 
      ? (supabase as any).from('notes').select('*, author:users(name, position)').in('notes_id', noteIds)
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? Promise.all(sessionIds.map((id: string) => fetchMsWithPatientWithWeight(id)))
      : Promise.resolve([])
  ])

  const notesData = notesRes?.data || []

  const resourceMap: Record<string, any> = {
    ...Object.fromEntries(notesData.map((n: any) => [n.notes_id, n])),
    ...Object.fromEntries(sessionsData.map((s: any) => [s.session_id, s]))
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <CollectionHeader collection={col} hosId={hos_id} />

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">

        <div className="p-4 bg-slate-50 border-b flex items-center justify-between px-8">
          <span className="text-xs font-bold text-slate-400">총 {items?.length || 0}개의 항목</span>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">In-place Viewing</span>
        </div>

        <div className="flex flex-col">
          {items?.length === 0 ? (
            <div className="py-24 text-center text-slate-400 italic text-sm">
              추가된 항목이 없습니다.
            </div>
          ) : (
            items?.map((item: any, idx: number) => (
              <CollectionItemRow 
                key={`${item.resource_type}-${item.resource_id}`}
                item={item}
                resourceData={resourceMap[item.resource_id]}
                hosId={hos_id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

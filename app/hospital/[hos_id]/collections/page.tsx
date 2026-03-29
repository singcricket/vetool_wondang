import { Suspense } from 'react'
import { fetchCollections } from '@/lib/services/collections/collections'
import Link from 'next/link'
import { Folder, ChevronRight, Plus, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import CreateCollectionButton from '@/components/hospital/collections/create-collection-button'

export default async function CollectionsPage(props: { params: Promise<{ hos_id: string }> }) {
  const params = await props.params;
  const { hos_id } = params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await (supabase as any)
    .from('resource_collections')
    .select(`
      *,
      items:resource_collection_items(*)
    `)
    .eq('hos_id', hos_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const collections = (data || []) as any[]

  return (

    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">컬렉션</h1>
          <p className="text-slate-500 text-sm">진료 노트와 모니터링 기록을 그룹화하여 관리하고 공유할 수 있습니다.</p>
        </div>
        <CreateCollectionButton hosId={hos_id} userId={user.id} />

      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collections.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed rounded-3xl gap-4">
            <Folder size={48} className="opacity-20" />
            <p className="text-lg font-bold">생성된 컬렉션이 없습니다.</p>
            <p className="text-sm">노트나 모니터링 상세 보기에서 '컬렉션에 추가'를 눌러 시작하세요.</p>
          </div>
        ) : (
          collections.map((col) => (
            <Link 
              key={col.collection_id} 
              href={`/hospital/${hos_id}/collections/${col.collection_id}`}
              className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Folder size={24} />
                </div>
                <div className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  항목 {col.items?.length || 0}개
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-black text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                  {col.title}
                </h2>
                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                  {col.description || '설명이 없습니다.'}
                </p>
              </div>

              <div className="mt-2 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {col.created_at ? format(new Date(col.created_at), 'yyyy.MM.dd') : ''}
                </span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

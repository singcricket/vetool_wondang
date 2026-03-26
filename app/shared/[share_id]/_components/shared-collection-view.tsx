import { createAdminClient } from '@/lib/supabase/admin'
import SharedCollectionLayout from './shared-collection-layout'
import SharedNoteView from './shared-note-view'
import SharedMonitoringView from './SharedMonitoringView'

interface Props {
  resourceId: string // collection_id
  restrictedData?: Record<string, boolean> | null
}

export default async function SharedCollectionView({ resourceId, restrictedData }: Props) {
  try {
    const supabase = createAdminClient()

    // 1. Fetch collection details
    const { data: collection, error: colError } = await (supabase as any)
      .from('resource_collections')
      .select('*')
      .eq('collection_id', resourceId)
      .single()

    if (colError || !collection) {
      return (
        <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
          <span className="font-bold text-red-500">컬렉션 정보를 불러올 수 없습니다.</span>
          <span className="text-xs break-all">디바깅 에러: {colError ? colError.message : '알 수 없는 오류 (데이터 없음)'}</span>
        </div>
      )
    }

    // 2. Fetch items
    const { data: items, error: itemsError } = await (supabase as any)
      .from('resource_collection_items')
      .select('*')
      .eq('collection_id', resourceId)
      .order('order_index', { ascending: true })

    if (itemsError) {
      return (
        <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
          <span className="font-bold text-red-500">컬렉션 항목을 불러올 수 없습니다.</span>
          <span className="text-xs break-all">디바깅 에러: {itemsError.message}</span>
        </div>
      )
    }

    // 3. Fetch item titles for better display
    const noteIds = items?.filter((i: any) => i.resource_type === 'note').map((i: any) => i.resource_id) || []
    const sessionIds = items?.filter((i: any) => i.resource_type === 'monitoring').map((i: any) => i.resource_id) || []

    const [notesRes, sessionsRes] = await Promise.all([
      noteIds.length > 0 
        ? (supabase as any).from('notes').select('notes_id, title').in('notes_id', noteIds)
        : Promise.resolve({ data: [] }),
      sessionIds.length > 0
        ? (supabase as any).from('monitoring_sessions').select('session_id, patient:patients(name)').in('session_id', sessionIds)
        : Promise.resolve({ data: [] })
    ])

    const notesData = notesRes?.data || []
    const sessionsData = sessionsRes?.data || []

    const titlesMap: Record<string, string> = {
      ...Object.fromEntries(notesData.map((n: any) => [n.notes_id, n.title])),
      ...Object.fromEntries(sessionsData.map((s: any) => [s.session_id, `모니터링: ${s.patient?.name || '알 수 없음'}`]))
    }

    const itemsWithTitles = items?.map((item: any) => ({
      ...item,
      displayTitle: titlesMap[item.resource_id] || (item.resource_type === 'note' ? '제목 없는 진료 기록' : '제목 없는 모니터링 세션')
    }))

    return (
      <SharedCollectionLayout 
        collection={collection} 
        items={itemsWithTitles || []} 
      >
        {itemsWithTitles?.map((item: any, idx: number) => (
          <div key={item.resource_id} data-index={idx} className="h-full w-full">
            {item.resource_type === 'note' && (
              <SharedNoteView resourceId={item.resource_id} restrictedData={restrictedData} />
            )}
            {item.resource_type === 'monitoring' && (
              <SharedMonitoringView resourceId={item.resource_id} restrictedData={restrictedData} />
            )}
            {item.resource_type === 'icu' && (
              <div className="p-12 text-center text-slate-500 min-h-[500px] flex flex-col items-center justify-center bg-white border rounded-xl shadow-sm">
                <span className="font-bold text-slate-400">ICU 뷰어는 준비 중입니다.</span>
              </div>
            )}
          </div>
        ))}
      </SharedCollectionLayout>
    )
  } catch (e: any) {
    console.error('SharedCollectionView Error:', e)
    return (
      <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
        <span className="font-bold text-red-500">컬렉션 뷰를 렌더링하는 중 오류가 발생했습니다.</span>
        <span className="text-xs">상세 내용: {e.message || '알 수 없는 서버 오류'}</span>
      </div>
    )
  }
}

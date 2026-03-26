import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SharedNoteView from './_components/shared-note-view'
import SharedMonitoringView from './_components/SharedMonitoringView'
import { Suspense } from 'react'

export default async function SharedResourcePage(props: { params: Promise<{ share_id: string }> }) {
  try {
    const params = await props.params;
    const shareId = params.share_id;

    // 1. Fetch share record and validate using the ADMIN client (Bypasses RLS since this is a secret UUID based link)
    const adminSupabase = createAdminClient()
    
    const { data: shareData, error } = await adminSupabase
      .from('resource_shares')
      .select('*')
      .eq('id', shareId)
      .single()

    const share = shareData as any

    if (error || !share) {
      console.error('Share fetch error:', error)
      return <InvalidShareView message="해당 공유 링크를 찾을 수 없거나 접근 권한이 없습니다." />
    }

    // 2. Validate expiration time
    const now = new Date()
    if (share.valid_until && new Date(share.valid_until) < now) {
      return <InvalidShareView message="만료된 공유 링크입니다." />
    }

    if (share.valid_from && new Date(share.valid_from) > now) {
      return <InvalidShareView message="아직 유효 시간이 도래하지 않은 링크입니다." />
    }

    // 3. Optional: Target validation for 'user' or 'hospital' targets could happen here if needed,
    // but RLS should technically handle it if we are using authenticated client.
    // Since this is server-side fetch without auth context yet, we skip manual target check 
    // unless we force login. For 'public', it's open. For user/hospital, we assume RLS checks this.

    // 4. Render content based on resource_type
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col pt-8">
        <div className="w-full max-w-5xl mx-auto px-4 lg:px-8 mb-4">
          <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tight text-slate-800">
                Vetool 공유 문서
              </h1>
              <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                {share.resource_type}
              </span>
            </div>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              병원 홈으로 가기
            </Link>
          </header>

          <Suspense fallback={<div className="p-12 text-center text-slate-400">문서를 불러오는 중...</div>}>
            {share.resource_type === 'note' && <SharedNoteView resourceId={share.resource_id} restrictedData={share.restricted_data} />}
            {share.resource_type === 'monitoring' && <SharedMonitoringView resourceId={share.resource_id} restrictedData={share.restricted_data} />}
            {share.resource_type === 'icu' && <div className="p-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border">ICU 뷰어는 준비 중입니다.</div>}
          </Suspense>
        </div>
      </main>
    )
  } catch (e: any) {
    console.error('Shared Page Render Error:', e)
    return (
      <InvalidShareView 
        message={`서버 오류가 발생했습니다. (매니저에게 문의주세요)\n에러 내용: ${e.message || '환경 변수(SERVICE_ROLE_KEY) 설정 확인이 필요할 수 있습니다.'}`} 
      />
    )
  }
}

function InvalidShareView({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center pt-32 px-4">
      <div className="bg-white border rounded-2xl shadow-sm p-8 max-w-md w-full text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">접근할 수 없음</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        <Link href="/" className="mt-4 w-full px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
          메인으로 돌아가기
        </Link>
      </div>
    </main>
  )
}

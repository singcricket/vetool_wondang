import { fetchMsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MsReportContent from '@/components/hospital/monitoring/session-header/ms-report/ms-report-content'

export default async function MonitoringReportPage(props: { 
  params: Promise<{ hos_id: string; target_date: string; session_id: string }> 
}) {
  const params = await props.params;
  const { hos_id, target_date, session_id } = params;

  // Fetch monitoring session data including patient and weight
  const msData = await fetchMsWithPatientWithWeight(session_id)

  if (!msData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500 font-bold">모니터링 데이터를 찾을 수 없습니다.</p>
        <Link 
          href={`/hospital/${hos_id}/monitoring/${target_date}` as any} 
          className="text-blue-500 hover:underline text-sm font-bold"
        >
          모니터링 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <header className="bg-slate-900 text-white p-4 px-6 flex items-center gap-4 shrink-0">
        <Link 
          href={`/hospital/${hos_id}/monitoring/${target_date}` as any}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          title="목록으로"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Monitoring Report</span>
          <h1 className="text-lg font-black tracking-tight">
            {msData.patient?.name} 모니터링 결과 리포트
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12 bg-slate-50">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 max-w-5xl mx-auto min-h-full overflow-hidden p-6 sm:p-10">
          <MsReportContent 
            msData={msData} 
            isSharedView={false}
          />
        </div>
      </main>
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import MsReportContent from '@/components/hospital/monitoring/session-header/ms-report/ms-report-content'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'

interface Props {
  resourceId: string
  restrictedData?: Record<string, boolean> | null
}

export default async function SharedMonitoringView({ resourceId, restrictedData }: Props) {
  try {
    const supabase = createAdminClient()

    // 1. Fetch monitoring session with patient relation
    const { data: sessionData, error } = await supabase
      .from('monitoring_sessions')
      .select(`
        *,
        patient:patients(*)
      `)
      .eq('session_id', resourceId)
      .single()

    if (error || !sessionData) {
      return (
        <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
          <span className="font-bold text-red-500">모니터링 차트 데이터를 불러올 수 없습니다.</span>
          <span className="text-xs break-all">디버깅 에러: {error ? error.message : '알 수 없는 오류 (데이터 없음)'}</span>
        </div>
      )
    }

    const msData = sessionData as unknown as MsWithPatientWithWeight

    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white border rounded-xl shadow-sm min-h-[500px]">
          <MsReportContent msData={msData} isSharedView={true} onClose={undefined} onExportText={undefined} />
        </div>
        
        <div className="text-center py-4 text-xs text-slate-400">
          ※ 외부 링크를 통한 읽기 전용 리포트 뷰입니다. 내용 수정은 불가능합니다.
        </div>
      </div>
    )
  } catch (e: any) {
    console.error('SharedMonitoringView Error:', e)
    return (
      <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
        <span className="font-bold text-red-500">모니터링 뷰를 렌더링하는 중 오류가 발생했습니다.</span>
        <span className="text-xs">상세 내용: {e.message || '알 수 없는 서버 오류'}</span>
      </div>
    )
  }
}


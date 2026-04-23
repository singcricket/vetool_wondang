import { createAdminClient } from '@/lib/supabase/admin'
import DentalReportGeneral from '@/components/hospital/dental/dental-report/dental-report-general'
import DentalReportDetailed from '@/components/hospital/dental/dental-report/dental-report-detailed'
import DentalReportOwner from '@/components/hospital/dental/dental-report/dental-report-owner'
import type { DentalChartDetail, DentalTooth, DentalImage } from '@/types/dental/dental-type'

interface Props {
  resourceId: string
  restrictedData?: Record<string, any> | null
}

export default async function SharedDentalView({ resourceId, restrictedData }: Props) {
  try {
    const supabase = createAdminClient()
    const viewType = restrictedData?.view_type || 'general'

    // 1. Parallel fetch all necessary dental data
    const [chartRes, teethRes, imagesRes] = await Promise.all([
      supabase
        .from('dental_charts')
        .select(`
          *,
          patient:patients(
            name, species, breed, hos_patient_id,
            birth, gender, owner_name, hos_owner_id,
            microchip_no, memo
          )
        `)
        .eq('id', resourceId)
        .single(),
      
      supabase
        .from('dental_chart_teeth')
        .select('*')
        .eq('chart_id', resourceId)
        .order('tooth_id', { ascending: true }),
      
      supabase
        .from('dental_images')
        .select('*')
        .eq('chart_id', resourceId)
        .order('created_at', { ascending: true })
    ])

    if (chartRes.error || !chartRes.data) {
      return (
        <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
          <span className="font-bold text-red-500">치과 차트 데이터를 불러올 수 없습니다.</span>
          <span className="text-xs">{chartRes.error?.message}</span>
        </div>
      )
    }

    const chartDetail = chartRes.data as unknown as DentalChartDetail
    const teeth = (teethRes.data || []) as unknown as DentalTooth[]
    const images = (imagesRes.data || []) as unknown as DentalImage[]
    const species = chartDetail.species ?? chartDetail.patient?.species ?? 'canine'

    return (
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Header (Shared Info) */}
        <div className="p-6 md:p-8 flex flex-col gap-2 border-b bg-slate-50/50">
          <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Dental Report Share</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
             치과 검진 리포트 - {chartDetail.patient?.name}
          </h1>
          <p className="text-sm text-slate-500">
            {chartDetail.chart_date} 검진 결과 ({viewType === 'general' ? '일반형' : viewType === 'detailed' ? '상세형' : '보호자용'})
          </p>
        </div>

        {/* Report Content */}
        <div className="p-4 md:p-12 bg-white">
          <div className="max-w-4xl mx-auto">
            {viewType === 'general' && (
              <DentalReportGeneral chartDetail={chartDetail} teeth={teeth} images={images} species={species} isShared={true} />
            )}
            {viewType === 'detailed' && (
              <DentalReportDetailed chartDetail={chartDetail} teeth={teeth} images={images} species={species} isShared={true} />
            )}
            {viewType === 'owner' && (
              <DentalReportOwner chartDetail={chartDetail} teeth={teeth} images={images} species={species} isShared={true} />
            )}
          </div>
        </div>
      </div>
    )
  } catch (e: any) {
    console.error('SharedDentalView Error:', e)
    return (
      <div className="bg-white p-12 text-center border rounded-xl shadow-sm text-slate-500 flex flex-col gap-2">
        <span className="font-bold text-red-500">리포트를 렌더링하는 중 오류가 발생했습니다.</span>
        <span className="text-xs">{e.message}</span>
      </div>
    )
  }
}

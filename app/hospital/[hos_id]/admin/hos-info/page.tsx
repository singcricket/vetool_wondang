import { createClient } from '@/lib/supabase/server'
import { getHosInfo } from '@/lib/actions/admin/hos-info-actions'
import HosInfoForm from '@/components/hospital/admin/hos-info/hos-info-form'

export default async function HosInfoPage(props: { params: Promise<{ hos_id: string }> }) {
  const { hos_id } = await props.params
  const supabase = await createClient()

  const { data } = await supabase
    .from('hospitals')
    .select('name')
    .eq('hos_id', hos_id)
    .single()

  const hosName = data?.name ?? ''
  const initialInfo = await getHosInfo(hos_id)

  return (
    <div className="p-4">
      <h1 className="mb-6 text-lg font-bold text-slate-800">병원 정보 설정</h1>
      <HosInfoForm hosId={hos_id} hosName={hosName} initialInfo={initialInfo} />
    </div>
  )
}

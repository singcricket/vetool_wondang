import { getSharedInquiryData } from '@/lib/actions/checkup/inquiry-share-actions'
import GuardianInquiryForm from './shared-checkup-inquiry-view'

interface Props {
  shareId: string
}

export default async function SharedCheckupInquiryPage({ shareId }: Props) {
  try {
    const { checkupId, patient, inquiry } = await getSharedInquiryData(shareId)
    return (
      <GuardianInquiryForm
        shareId={shareId}
        checkupId={checkupId}
        patient={patient}
        initialInquiry={inquiry}
      />
    )
  } catch (e: any) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
        <p className="font-bold text-red-500">문진 정보를 불러올 수 없습니다.</p>
        <p className="mt-1 text-xs text-slate-400">{e.message}</p>
      </div>
    )
  }
}

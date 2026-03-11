'use client'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsTitle from '@/components/hospital/monitoring/session-body/session-info/ms-title'
import MsVets from '@/components/hospital/monitoring/session-body/session-info/msvets/msvets'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'
import MsGroup from '@/components/hospital/monitoring/session-body/session-info/msgroup/ms-group'
import MsTag from '@/components/hospital/monitoring/session-body/session-info/mstags'
import { BookmarkIcon } from 'lucide-react'
import AddTemplateDialog from './addtemplate/add-template-dialog'
export default function MsInfoContainer({
  msData,
}: {
  msData: MsWithPatientWithWeight
}) {
  const {
    session_title,
    session_id,
    vet_sub,
    vet_main,
    session_group,
    vet_primary,
    tags,
    user_tags
    
  } = msData
 const { msContextData } = useMonitoringContextData();
 
 const { groupListData, vetsListData, plan } = msContextData;
  return (
    <div className="mb-4 flex flex-wrap gap-2">
     <div className="w-full md:w-[calc(10%-0.5rem)]">
                      <AddTemplateDialog msData={msData}  />
                      </div>
      <div className="w-full md:w-[calc(40%-0.5rem)]">
        <MsTitle title={session_title} sessionId={session_id} />
      </div>
      <div className="w-full md:w-[calc(25%-0.5rem)]">
        <MsVets mainVet={vet_main} primaryVet={vet_primary} subVet={vet_sub} sessionId={session_id} vetsListData={vetsListData} />
      </div>
      <div className="w-full md:w-[calc(25%-0.5rem)]">
        <MsGroup groupListData={groupListData} sessionId={session_id} currentGroups={session_group} />
      </div>
      <div className="w-full">
        <MsTag msTag={user_tags ?? ''} sessionId={session_id} msData={msData} />
      </div>
    </div>
  )
}

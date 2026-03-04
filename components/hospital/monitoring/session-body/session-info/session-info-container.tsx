'use client'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
// import ClTag from './cl-tag'
// import ClTitle from './cl-title'
// import ClType from './cl-type'
// import ClVet from './cl-vet'
// import ClGroup from './group/cl-group'
import MsTitle from '@/components/hospital/monitoring/session-body/session-info/ms-title'
import MsVets from '@/components/hospital/monitoring/session-body/session-info/msvets/msvets'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'
import MsGroup from '@/components/hospital/monitoring/session-body/session-info/msgroup/ms-group'
import MsTag from '@/components/hospital/monitoring/session-body/session-info/mstags'
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
    <div className="mb-4 grid grid-cols-12 gap-2">
        <div className="col-span-6">
        <MsTitle title={session_title} sessionId={session_id} />
      </div>
      <div className="col-span-3">
        <MsVets mainVet={vet_main} primaryVet={vet_primary} subVet={vet_sub} sessionId={session_id}  vetsListData={vetsListData}/>
      </div>
      <div className="col-span-3">
        <MsGroup groupListData={groupListData} sessionId={session_id} currentGroups = {session_group}/>
      </div>
       <div className="col-span-12">
        <MsTag msTag={user_tags ?? ''} sessionId={session_id} />
      </div>

      
    </div>
  )
}

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { useMonitoringContextData } from "@/providers/monitoring-hos-data-context-provider"
import MsClSelect from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-header/ms-cl-select";
import MsClInterval from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-header/ms-cl-interval";
import MsClPlanTime from "./ms-cl-plan-time";
import { VITAL_REFERENCE_DATA } from "@/types/monitoring/monitoring-type";

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClHeader({ msData }: Props) {
 
    const clNames : string[] = []
    VITAL_REFERENCE_DATA.map((db)=>{
        clNames.push(db.vitalName)
    })
   
    
    return (
       <div className="mt-12 flex w-full flex-col gap-2 p-2">
            <MsClSelect msData={msData} clNames={clNames}/>
            <MsClInterval msData={msData}/>
            {/* <div className="col-span-1"><MsClPlanTime msData={msData}/></div> */}
        </div>
    )
}
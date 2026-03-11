'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { VITAL_REFERENCE_DATA } from "@/types/monitoring/monitoring-type"
import MsMobileClTimeSelect from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-table/mobile/ms-mobile-cl-timeselect"
import MsMobileClInputTable from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-table/mobile/ms-mobile-cl-input-table"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsMobileClTable({ msData }: Props) {
    
        const clNames : string[] = []
        VITAL_REFERENCE_DATA.map((db)=>{
          clNames.push(db.vitalName)
        })
        
     
     
    return (
      <div className="flex gap-2">
       <MsMobileClTimeSelect />
       <MsMobileClInputTable />
      </div>
    )
}
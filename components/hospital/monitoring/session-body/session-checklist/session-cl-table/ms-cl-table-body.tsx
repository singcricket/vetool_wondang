'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import {  TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { VITAL_REFERENCE_DATA } from "@/types/monitoring/monitoring-type"
import MsClTableCreateRow from "./ms-cl-table-create-row"
import MsClTableResultRow from "./ms-cl-table-result-row"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClTableBody({ msData }: Props) {
    
        const clNames : string[] = []
        VITAL_REFERENCE_DATA.map((db)=>{
          clNames.push(db.vitalName)
        })
        
       

     
    return (
        
 <TableBody>
    {msData.vital_results?.map((timeSlot, index) => (
        <MsClTableResultRow
            key={timeSlot.create_timestamp + index}
            sessionId={msData.session_id}
            timeSlot={timeSlot}
            slotIndex={index}
            allVitalResults={msData.vital_results!}
            selectedVital={msData.planned_vitals}
            clNames={clNames}
            startTime={msData.start_time}
        />
    ))}
<MsClTableCreateRow
  sessionId={msData.session_id}
  selectedVital = {msData.planned_vitals}
  vitalData={msData.vital_results}
  clNames={clNames}
  startTime={msData.start_time}
  intervalSetting={msData.interval_setting}
/>
 </TableBody>
       
    )
}
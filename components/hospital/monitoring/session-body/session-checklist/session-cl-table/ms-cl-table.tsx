'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { Table } from '@/components/ui/table'
import { VITAL_REFERENCE_DATA } from "@/types/monitoring/monitoring-type"
import MsClTableHeader from "./ms-cl-table-header"
import MsClTableBody from "./ms-cl-table-body"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClTable({ msData }: Props) {
    
        const clNames : string[] = []
        VITAL_REFERENCE_DATA.map((db)=>{
          clNames.push(db.vitalName)
        })
        
     
     
    return (
        <Table className="border">
          <MsClTableHeader msData={msData} />
          <MsClTableBody msData={msData} />
        </Table>
    )
}
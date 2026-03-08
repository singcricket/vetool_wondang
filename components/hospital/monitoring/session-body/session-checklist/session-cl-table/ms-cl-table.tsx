'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState } from 'react'
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
        
        const selectedClNames = msData.planned_vitals && msData.planned_vitals.length>0 ? [...msData.planned_vitals] : [...clNames]

     
    return (
        <Table className="border">
          <MsClTableHeader msData={msData} />
          <MsClTableBody msData={msData} />
        </Table>
    )
}
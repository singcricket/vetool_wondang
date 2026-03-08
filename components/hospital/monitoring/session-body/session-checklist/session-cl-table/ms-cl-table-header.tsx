'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import {  TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { VITAL_REFERENCE_DATA } from "@/types/monitoring/monitoring-type"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClTableHeader({ msData }: Props) {
    
        const clNames : string[] = []
        VITAL_REFERENCE_DATA.map((db)=>{
          clNames.push(db.vitalName)
        })
        
        const selectedClNames = msData.planned_vitals && msData.planned_vitals.length>0 ? [...msData.planned_vitals] : [...clNames]

     
    return (
        
 <TableHeader className="sticky top-12 z-20 bg-white shadow-sm">
      <TableRow className="relative divide-x">
   <TableHead
          className="flex items-center justify-between px-0.5"
          style={{
            width: 128,
            transition: 'width 0.3s ease-in-out ',
          }}
        >
        

          <span className="w-full text-center">시간(Min)</span>

         
        </TableHead>
        {clNames.map((vital)=>{
            if(selectedClNames.includes(vital)){
            return(
                 <TableHead className="relative border text-center" key={vital}>
                    {vital}
                 </TableHead>
                )
            }
            
        })}
        <TableHead className="w-12 text-center">삭제</TableHead>
      </TableRow>
</TableHeader>
       
    )
}
'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import MsClHeader from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-header/ms-cl-header"
import MsClTable from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-table/ms-cl-table"
import MsMobileClTable from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-table/mobile/ms-mobile-cl-table"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClContainer({ msData }: Props) {
    return (
        <div className="flex flex-col gap-4">
            <MsClHeader msData={msData} />
            
            <div className="hidden md:block">
                <MsClTable msData={msData} />
            </div>
            
            <div className="md:hidden">
                <MsMobileClTable msData={msData} />
            </div>
        </div>
    )
}
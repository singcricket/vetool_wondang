'use client'

import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import MsClHeader from "@/components/hospital/monitoring/session-body/session-checklist/session-cl-header/ms-cl-header"
import MsClTable from "@//components/hospital/monitoring/session-body/session-checklist/session-cl-table/ms-cl-table"

type Props = {
    msData: MsWithPatientWithWeight
}

export default function MsClContainer({ msData }: Props) {
    return (
        <div>
            <MsClHeader msData={msData} />
            <MsClTable msData={msData} />
        </div>
    )
}
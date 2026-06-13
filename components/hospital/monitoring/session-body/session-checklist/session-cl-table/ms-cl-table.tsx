'use client'

import { forwardRef } from 'react'
import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { Table } from '@/components/ui/table'
import MsClTableHeader from "./ms-cl-table-header"
import MsClTableBody, { type MsClTableBodyHandle } from "./ms-cl-table-body"

type Props = {
    msData: MsWithPatientWithWeight
}

const MsClTable = forwardRef<MsClTableBodyHandle, Props>(function MsClTable({ msData }, ref) {
    return (
        <Table className="border">
            <MsClTableHeader msData={msData} />
            <MsClTableBody ref={ref} msData={msData} />
        </Table>
    )
})

export default MsClTable

'use client'

import DataTable from "@/components/ui/data-table"
import { monitoringSessionsColumns } from "./monitoring-sessions-columns"
import type { MonitoringSessionChart } from "@/lib/services/monitoring/fetch-ms-data"

type Props = {
    monitoringSessions: MonitoringSessionChart[]
    hosId: string
}

export default function MsSearchEntry({ monitoringSessions, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='모니터링 이름 검색'
            data={monitoringSessions}
            columns={monitoringSessionsColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}
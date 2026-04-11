'use client'

import DataTable from "@/components/ui/data-table"
import { echoChartsColumns } from "./echo-charts-columns"
import type { EchoChartWithPatient } from "@/types/echocardio/echocardio-type"

type Props = {
    echoCharts: EchoChartWithPatient[]
    hosId: string
}

export default function EchoSearchEntry({ echoCharts, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='환자 이름 또는 차트 태그 검색'
            data={echoCharts}
            columns={echoChartsColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}

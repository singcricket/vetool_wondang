'use client'

import DataTable from "@/components/ui/data-table"
import { neuroChartsColumns } from "./neuro-charts-columns"
import type { NeuroChartDetail } from "@/types/hospital/neuro-type"

type Props = {
    neuroCharts: NeuroChartDetail[]
    hosId: string
}

export default function NeuroSearchEntry({ neuroCharts, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='환자 이름으로 검색'
            data={neuroCharts}
            columns={neuroChartsColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}

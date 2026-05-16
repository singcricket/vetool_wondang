'use client'

import DataTable from "@/components/ui/data-table"
import { ophthalmicChartsColumns } from "./ophthalmic-charts-columns"
import type { OphthalmicChartDetail } from "@/types/hospital/ophthalmic-type"

type Props = {
    ophthalmicCharts: OphthalmicChartDetail[]
    hosId: string
}

export default function OphthalmicSearchEntry({ ophthalmicCharts, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='환자 이름으로 검색'
            data={ophthalmicCharts}
            columns={ophthalmicChartsColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}

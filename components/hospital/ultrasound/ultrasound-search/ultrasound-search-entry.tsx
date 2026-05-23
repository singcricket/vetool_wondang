'use client'

import DataTable from "@/components/ui/data-table"
import { ultrasoundChartsColumns } from "./ultrasound-charts-columns"
import type { UltrasoundChartDetail } from "@/types/hospital/ultrasound-type"

type Props = {
    ultrasoundCharts: UltrasoundChartDetail[]
    hosId: string
}

export default function UltrasoundSearchEntry({ ultrasoundCharts, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='환자 이름으로 검색'
            data={ultrasoundCharts}
            columns={ultrasoundChartsColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}

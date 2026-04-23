'use client'

import DataTable from "@/components/ui/data-table"
import { dentalChartsColumns } from "./dental-charts-columns"
import type { DentalChartWithPatient } from "@/types/dental/dental-type"

type Props = {
    dentalCharts: DentalChartWithPatient[]
    hosId: string
}

export default function DentalSearchEntry({ dentalCharts, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='환자 이름으로 검색'
            data={dentalCharts}
            columns={dentalChartsColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}

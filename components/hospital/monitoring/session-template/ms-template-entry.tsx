'use client'

import DataTable from "@/components/ui/data-table"
import { MsTemplateChart } from "@/lib/services/monitoring/fetch-ms-data"
import { msTemplateColumns } from "./ms-template-columns"

type Props = {
    msTemplates: MsTemplateChart[]
    hosId: string
}

export default function MsTemplateEntry({ msTemplates, hosId }: Props) {
    return (
         <div className="p-2">
          <DataTable
            searchPlaceHolder='템플릿 이름 · 템플릿 설명 검색'
            data={msTemplates}
            columns={msTemplateColumns(hosId)}
            rowLength={10}
          />
        </div>
    )
}
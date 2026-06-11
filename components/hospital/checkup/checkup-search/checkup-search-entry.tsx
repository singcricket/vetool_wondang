'use client'

import DataTable from '@/components/ui/data-table'
import { checkupSearchColumns } from './checkup-search-columns'
import type { CheckupSearchItem } from '@/types/hospital/checkup-type'

type Props = {
  checkupRecords: CheckupSearchItem[]
  hosId: string
}

export default function CheckupSearchEntry({ checkupRecords, hosId }: Props) {
  return (
    <div className="p-2">
      <DataTable
        searchPlaceHolder="환자 이름 / 차트번호 / 품종으로 검색"
        data={checkupRecords}
        columns={checkupSearchColumns(hosId)}
        rowLength={15}
      />
    </div>
  )
}

'use client'

import DataTable from '@/components/ui/data-table'
import type { AiProtocolOption } from '@/lib/actions/oncology/ai-oncology-guide'
import { oncologyTemplateColumns } from './oncology-template-columns'

type Props = {
  protocols: AiProtocolOption[]
  hosId: string
}

export default function OncologyTemplateEntry({ protocols, hosId }: Props) {
  return (
    <div className="p-2">
      <DataTable
        searchPlaceHolder="프로토콜 이름 · 태그 검색"
        data={protocols}
        columns={oncologyTemplateColumns(hosId)}
        rowLength={15}
      />
    </div>
  )
}

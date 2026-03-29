'use client'

import DataTable from '@/components/ui/data-table'
import type { EchoTemplate } from '@/types/echocardio/echocardio-type'
import { echoTemplateColumns } from './echo-template-columns'

type Props = {
  templates: EchoTemplate[]
  hosId: string
  testUIMeta: any[]
}

export default function EchoTemplateEntry({ templates, hosId, testUIMeta }: Props) {
  return (
    <div className="p-2">
      <DataTable
        searchPlaceHolder="템플릿 이름 · 설명 검색"
        data={templates}
        columns={echoTemplateColumns(hosId, testUIMeta)}
        rowLength={10}
      />
    </div>
  )
}

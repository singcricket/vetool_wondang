'use client'

import FormattedMonoDate from '@/components/common/formatted-mono-date'
import PreviewDialog from '@/components/hospital/common/preview/preview-dialog'
import DeleteTemplateDialog from '@/components/hospital/icu/main/template/delete-template-dialog'
import { Button } from '@/components/ui/button'
import type { MsTemplateChart } from '@/lib/services/monitoring/fetch-ms-data'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDownIcon } from 'lucide-react'
import UpsertMsTemplateDialog from './upsert-ms-template-dialog'
import DeleteMsTemplateDialog from './delete-ms-template-dialog'
// import UpsertTemplateDialog from './upsert-template-dialog'

export const msTemplateColumns = (hosId: string): ColumnDef<MsTemplateChart>[] => [
  {
    accessorKey: 'session_template_title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          템플릿 이름
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    
  },
  {
    accessorKey: 'session_comment',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          설명
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          생성일
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = row.original.created_at

      return <FormattedMonoDate date={createdAt??''} className="text-xs" />
    },
  },

  {
    id: 'preview',
    header: '확인 및 수정',
    size: 50,
    cell: ({ row }) => {
      const templateChartId = row.original.session_template_id

      return (
        <UpsertMsTemplateDialog
        hosId={hosId}
        isEdit={true}
        mstemplate={row.original}
        />
      )
    },
  },
  {
    id: 'delete',
    header: '삭제',
    size: 50,
    cell: ({ row }) => {
      const templateChartId = row.original.session_template_id

      return (
        <div className="flex justify-center">
          <DeleteMsTemplateDialog
            templateName={row.original.session_template_title}
            mstemplateId={templateChartId}
          />
        </div>
      )
    },
  },
]

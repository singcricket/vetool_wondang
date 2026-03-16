'use client'

import FormattedMonoDate from '@/components/common/formatted-mono-date'
import { Button } from '@/components/ui/button'
import type { MonitoringSessionChart, MsTemplateChart } from '@/lib/services/monitoring/fetch-ms-data'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDownIcon } from 'lucide-react'

// import UpsertTemplateDialog from './upsert-template-dialog'

export const monitoringSessionsColumns = (hosId: string): ColumnDef<MonitoringSessionChart>[] => [
  {
    accessorKey: 'session_title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          모니터링 이름
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    
  },
  {
    accessorKey: 'due_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          날짜
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
    header: '미리보기',
    size: 50,
    cell: ({ row }) => {
      const templateChartId = row.original.session_id

    //   return (
    //     <UpsertMsTemplateDialog
    //     hosId={hosId}
    //     isEdit={true}
    //     mstemplate={row.original}
    //     />
    //   )
    },
  },
  {
    id: 'delete',
    header: '이동',
    size: 50,
    cell: ({ row }) => {
      const templateChartId = row.original.session_id

    //   return (
    //     <div className="flex justify-center">
    //       <DeleteMsTemplateDialog
    //         templateName={row.original.session_template_title}
    //         mstemplateId={templateChartId}
    //       />
    //     </div>
    //   )
    },
  },
]

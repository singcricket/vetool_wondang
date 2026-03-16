'use client'

import FormattedMonoDate from '@/components/common/formatted-mono-date'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import MsReport from '@/components/hospital/monitoring/session-header/ms-report/ms-report'
import type { MonitoringSessionChart, MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { cn } from '@/lib/utils/utils'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDownIcon, ExternalLinkIcon, EyeIcon } from 'lucide-react'
import Link from 'next/link'

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
    filterFn: (row, columnId, filterValue) => {
      const title = (row.getValue(columnId) as string) ?? ''
      const tags = (row.original.tags as string) ?? ''
      const search = filterValue.toLowerCase()
      return title.toLowerCase().includes(search) || tags.toLowerCase().includes(search)
    }
  },
  {
    accessorKey: 'due_date',
    enableGlobalFilter: false,
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
    enableGlobalFilter: false,
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
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <EyeIcon size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>리포트 미리보기</DialogTitle>
            </DialogHeader>
            <MsReport 
              msData={row.original as unknown as MsWithPatientWithWeight} 
              imageSize="medium"
            />
          </DialogContent>
        </Dialog>
      )
    },
  },
  {
    id: 'move',
    header: '이동',
    size: 50,
    cell: ({ row }) => {
      const { session_id, due_date } = row.original
      const targetDate = format(new Date(due_date ?? new Date()), 'yyyy-MM-dd')

      return (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link
            href={`/hospital/${hosId}/monitoring/${targetDate}/monitoring-session/${session_id}/session`}
          >
            <ExternalLinkIcon size={16} />
          </Link>
        </Button>
      )
    },
  },
]

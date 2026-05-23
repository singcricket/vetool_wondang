'use client'

import FormattedMonoDate from '@/components/common/formatted-mono-date'
import { Button } from '@/components/ui/button'
import type { UltrasoundChartDetail } from '@/types/hospital/ultrasound-type'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDownIcon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'

export const ultrasoundChartsColumns = (hosId: string): ColumnDef<UltrasoundChartDetail>[] => [
  {
    accessorKey: 'patient.name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          환자 이름
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2 px-4 italic underline underline-offset-2">
            {row.original.patient?.name}
            <span className='text-xs text-muted-foreground'>({row.original.patient?.hos_patient_id})</span>
        </div>
      )
    },
    filterFn: (row, columnId, filterValue) => {
      const name = row.original.patient?.name ?? ''
      const hosPatientId = row.original.patient?.hos_patient_id ?? ''
      const search = (filterValue as string ?? '').toLowerCase()

      return (
        name.toLowerCase().includes(search) || 
        hosPatientId.toLowerCase().includes(search)
      )
    }
  },
  {
    accessorKey: 'chart_date',
    enableGlobalFilter: false,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="default"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          검사일
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

      return <FormattedMonoDate date={createdAt ?? ''} className="text-xs" />
    },
  },
  {
    id: 'move',
    header: '이동',
    size: 50,
    cell: ({ row }) => {
      const { id, chart_date } = row.original
      const targetDate = format(new Date(chart_date ?? new Date()), 'yyyy-MM-dd')

      return (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link
            href={`/hospital/${hosId}/ultrasound/${targetDate}/${id}`}
          >
            <ExternalLinkIcon size={16} />
          </Link>
        </Button>
      )
    },
  },
]

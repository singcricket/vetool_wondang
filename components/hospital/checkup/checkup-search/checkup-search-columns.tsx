'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import FormattedMonoDate from '@/components/common/formatted-mono-date'
import type { CheckupSearchItem, CheckupStatus } from '@/types/hospital/checkup-type'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDownIcon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABEL: Record<CheckupStatus, string> = {
  draft: '작성 중',
  reviewing: '검토 중',
  approved: '완료',
}

const STATUS_CLASS: Record<CheckupStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  reviewing: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  approved: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
}

export const checkupSearchColumns = (hosId: string): ColumnDef<CheckupSearchItem>[] => [
  {
    accessorKey: 'patient_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        환자 이름
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 px-4">
        <span className="font-medium italic underline underline-offset-2">
          {row.original.patient_name}
        </span>
        <span className="text-xs text-muted-foreground">
          ({row.original.hos_patient_id})
        </span>
      </div>
    ),
    filterFn: (row, _columnId, filterValue) => {
      const search = (filterValue as string ?? '').toLowerCase()
      return (
        row.original.patient_name.toLowerCase().includes(search) ||
        row.original.hos_patient_id.toLowerCase().includes(search) ||
        row.original.breed.toLowerCase().includes(search)
      )
    },
  },
  {
    accessorKey: 'species',
    enableGlobalFilter: false,
    header: '종/품종',
    cell: ({ row }) => (
      <span className="px-4 text-sm text-slate-600">
        {row.original.species} · {row.original.breed}
      </span>
    ),
  },
  {
    accessorKey: 'checkup_date',
    enableGlobalFilter: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        검진일
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="px-4 font-mono text-sm">{row.original.checkup_date}</span>
    ),
  },
  {
    accessorKey: 'vet_name',
    enableGlobalFilter: false,
    header: '담당 수의사',
    cell: ({ row }) => (
      <span className="px-4 text-sm text-slate-600">
        {row.original.vet_name ?? '-'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    enableGlobalFilter: false,
    header: '상태',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <div className="px-4">
          <Badge className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    enableGlobalFilter: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        생성일
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <FormattedMonoDate date={row.original.created_at} className="px-4 text-xs" />
    ),
  },
  {
    id: 'move',
    header: '이동',
    size: 50,
    cell: ({ row }) => {
      const { id, checkup_date } = row.original
      const targetDate = format(new Date(checkup_date), 'yyyy-MM-dd')
      return (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/hospital/${hosId}/checkup/${targetDate}/${id}`}>
            <ExternalLinkIcon size={16} />
          </Link>
        </Button>
      )
    },
  },
]

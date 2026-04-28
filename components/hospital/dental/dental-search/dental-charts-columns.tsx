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
import DentalReportPreview from '@/components/hospital/dental/dental-report/dental-report-preview'
import type { DentalChartWithPatient } from '@/types/dental/dental-type'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDownIcon, ExternalLinkIcon, EyeIcon } from 'lucide-react'
import Link from 'next/link'

export const dentalChartsColumns = (hosId: string): ColumnDef<DentalChartWithPatient>[] => [
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
            {row.original.patient.name}
            <span className='text-xs text-muted-foreground'>({row.original.patient.hos_patient_id})</span>
        </div>
      )
    },
    filterFn: (row, columnId, filterValue) => {
      const name = row.original.patient?.name ?? ''
      const hosPatientId = row.original.patient?.hos_patient_id ?? ''
      const tags = row.original.tags ?? ''
      const search = (filterValue as string ?? '').toLowerCase()

      return (
        name.toLowerCase().includes(search) || 
        hosPatientId.toLowerCase().includes(search) || 
        tags.toLowerCase().includes(search)
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
              <DialogTitle>치과 리포트 미리보기</DialogTitle>
            </DialogHeader>
            <DentalReportPreview 
               dentalId={row.original.id}
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
      const { id, chart_date } = row.original
      const targetDate = format(new Date(chart_date ?? new Date()), 'yyyy-MM-dd')

      return (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link
            href={`/hospital/${hosId}/dental/${targetDate}/${id}`}
          >
            <ExternalLinkIcon size={16} />
          </Link>
        </Button>
      )
    },
  },
]

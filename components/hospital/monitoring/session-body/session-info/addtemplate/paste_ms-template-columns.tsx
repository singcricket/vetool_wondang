import FormattedMonoDate from '@/components/common/formatted-mono-date'
import PreviewDialog from '@/components/hospital/common/preview/preview-dialog'
import { Button } from '@/components/ui/button'
import type {  MsTemplate } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDownIcon } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import UpsertMsTemplateDialog from '../../../session-template/upsert-ms-template-dialog'
import { MsTemplateChart, MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import ConfirmPasteTemplateDialog from '@/components/hospital/icu/main/chart/paste-chart-dialogs/template/confirm-paste-template-dialog'
import ConfirmPasteMsTemplateDialog from './confirm-paste-ms-template-dialog'
// import ConfirmPasteTemplateDialog from '@/components/hospital/monitoring/session-body/session-info/addtemplate/confirm-paste-template-dialog'

type Props = PasteChartDialogProps



type PasteChartDialogProps = {
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>

  msData : MsWithPatientWithWeight
  
}

export const pasteMsTemplateColumns = (
  {setIsDialogOpen,msData}: Props,
): ColumnDef<MsTemplateChart>[] => [
  {
    accessorKey: 'session_template_title',
    header: ({ column }) => {
      return (
        <Button
          size="default"
          variant="ghost"
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
          size="default"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          설명
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const comment = row.original.session_comment
      return <div>{comment ?? '없음'}</div>
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          size="default"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          생성일
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = row.original.created_at
      return <FormattedMonoDate date={createdAt??new Date()} className="text-xs" />
    },
  },

  {
    accessorKey: 'preview',
    header: '미리보기 및 수정',
    cell: ({ row }) => {
      

      return (
       <UpsertMsTemplateDialog
         hosId={row.original.hos_id}
          isEdit={true}
          mstemplate={row.original}
       />
      )
    },
  },
  {
    accessorKey: 'action',
    header: '선택',
    cell: ({ row }) => {
    //   const templateChartId = row.original.icu_chart_id
      return (
        <ConfirmPasteMsTemplateDialog
          setIsDialogOpen={setIsDialogOpen}
          msTemplate={row.original}
          msData={msData}
        />
      )
    },
  },
]

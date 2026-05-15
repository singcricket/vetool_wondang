'use client'

import type { AiProtocolOption } from '@/lib/actions/oncology/ai-oncology-guide'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DeleteProtocolDialog from './delete-protocol-dialog'
import UpsertProtocolSheet from './upsert-protocol-sheet'

const PROTOCOL_TYPE_LABEL: Record<string, string> = {
  chemo: 'Chemo',
  radiation: 'Radiation',
  surgery: 'Surgery',
  multimodal: 'Multimodal',
}

const PHASE_LABEL: Record<string, string> = {
  induction: 'Induction',
  maintenance: 'Maintenance',
  rescue: 'Rescue',
  adjuvant: 'Adjuvant',
}

export const oncologyTemplateColumns = (hosId: string): ColumnDef<AiProtocolOption>[] => [
  {
    accessorKey: 'protocol_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        프로토콜 이름
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'protocol_type',
    header: '종류',
    cell: ({ row }) => PROTOCOL_TYPE_LABEL[row.original.protocol_type] ?? row.original.protocol_type,
  },
  {
    accessorKey: 'phase',
    header: '단계',
    cell: ({ row }) => PHASE_LABEL[row.original.phase] ?? row.original.phase,
  },
  {
    accessorKey: 'total_cycles',
    header: '사이클',
    cell: ({ row }) => (row.original.total_cycles != null ? `${row.original.total_cycles}회` : '-'),
  },
  {
    accessorKey: 'user_tags',
    header: '태그',
    cell: ({ row }) => (row.original.user_tags ?? '') || '-',
  },
  {
    id: 'edit',
    header: '수정',
    size: 60,
    cell: ({ row }) => (
      <UpsertProtocolSheet
        mode="edit"
        hosId={hosId}
        protocol={row.original}
      />
    ),
  },
  {
    id: 'delete',
    header: '삭제',
    size: 60,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DeleteProtocolDialog
          protocolId={row.original.id!}
          protocolName={row.original.protocol_name}
        />
      </div>
    ),
  },
]
